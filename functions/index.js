const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
const crypto = require("crypto");
const zlib = require("zlib");
const { onRequest } = require("firebase-functions/v2/https");

// ============================================================================
// CONFIGURAÇÃO DA STRIPE
// ============================================================================
const stripe = require("stripe")("sk_test_51T3iV5LK0sp6cEMAbpSV1cM4MGESQ9s3EOffFfpUuiU0cbinuy64HCekpoyfAuWZy1gemNFcSpgF1cKPgHDM3pf500vcGP7tGW");

if (!admin.apps.length) admin.initializeApp();

const geminiKey = defineSecret("GEMINI_KEY");
const openAiKey = defineSecret("OPENAI_KEY"); // <-- NOVA CHAVE DA OPENAI ADICIONADA AQUI

const getProjectId = () => process.env.GCLOUD_PROJECT || JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;

const getGeminiClient = () => {
  const apiKey = geminiKey.value();
  if (!apiKey) throw new HttpsError("failed-precondition", "Secret GEMINI_KEY ausente.");
  return new GoogleGenerativeAI(apiKey);
};

const slugify = (value = "") => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

const ensureAuthed = (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Faça login para continuar.");
  return request.auth.uid;
};

// ============================================================================
// FUNÇÕES DE INFRAESTRUTURA (HOSTING)
// ============================================================================
async function getFirebaseAccessToken() {
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/firebase"] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token || token;
}

async function configureSiteRetention(siteId) {
  try {
    const projectId = getProjectId();
    if (!projectId) return;
    const token = await getFirebaseAccessToken();
    const url = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites/${siteId}/config?updateMask=maxVersions`;
    await fetch(url, {
      method: "PATCH", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ maxVersions: 2 }),
    });
  } catch (e) { console.error(`Falha retenção ${siteId}`, e); }
}

async function createHostingSiteIfPossible(siteId) {
  const projectId = getProjectId();
  if (!projectId) return { status: "error", message: "GCLOUD_PROJECT não disponível." };
  const token = await getFirebaseAccessToken();
  const url = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites?siteId=${siteId}`;
  const response = await fetch(url, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "USER_SITE" }),
  });
  if (response.status === 409) return { status: "already_exists", defaultUrl: `https://${siteId}.web.app` };
  if (!response.ok) return { status: "error", message: (await response.text()).slice(0, 400) };
  const site = await response.json();
  return { status: "created", site: site.name, defaultUrl: site.defaultUrl || `https://${siteId}.web.app` };
}

function sha256Hex(content) { return crypto.createHash("sha256").update(content).digest("hex"); }

async function deployHtmlToFirebaseHosting(siteId, htmlContent) {
  const token = await getFirebaseAccessToken();
  const htmlBuffer = Buffer.from(htmlContent, "utf-8");
  const gzippedContent = zlib.gzipSync(htmlBuffer);
  const fileHash = sha256Hex(gzippedContent);

  const createVersion = await fetch(`https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions`, {
    method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ config: { rewrites: [{ glob: "**", path: "/index.html" }] } }),
  });
  if (!createVersion.ok) throw new Error(`Falha criar versão: ${await createVersion.text()}`);
  const version = await createVersion.json();
  const versionName = version.name;

  const populate = await fetch(`https://firebasehosting.googleapis.com/v1beta1/${versionName}:populateFiles`, {
    method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: { "/index.html": fileHash } }),
  });
  if (!populate.ok) throw new Error(`Falha populate: ${await populate.text()}`);
  const populateData = await populate.json();

  if ((populateData.uploadRequiredHashes || []).includes(fileHash)) {
    const up = await fetch(`${populateData.uploadUrl}/${fileHash}`, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/octet-stream", "Content-Length": gzippedContent.length.toString() },
      body: gzippedContent,
    });
    if (!up.ok) throw new Error(`Falha upload: ${await up.text()}`);
  }

  await fetch(`https://firebasehosting.googleapis.com/v1beta1/${versionName}?updateMask=status`, {
    method: "PATCH", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "FINALIZED" }),
  });

  const release = await fetch(`https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/releases?versionName=${encodeURIComponent(versionName)}`, {
    method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Deploy automático" }),
  });

  return { versionName, release: await release.json() };
}

async function ensureHostingReady(siteId) {
  const existingOrNew = await createHostingSiteIfPossible(siteId);
  if (existingOrNew.status === "created" || existingOrNew.status === "already_exists") {
    await configureSiteRetention(siteId);
    return existingOrNew;
  }
  throw new HttpsError("failed-precondition", existingOrNew?.message || "Falha ao preparar o Firebase Hosting.");
}

// ============================================================================
// INTELIGÊNCIA ARTIFICIAL E GESTÃO DE PROJETOS
// ============================================================================
exports.generateSite = onCall({ cors: true, timeoutSeconds: 60, memory: "256MiB", secrets: [geminiKey] }, async (request) => {
  const genAI = getGeminiClient();
  const { businessName, description, region } = request.data;
  if (!businessName) throw new HttpsError("invalid-argument", "Nome obrigatório");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
  const prompt = `Atue como um redator publicitário sênior. Empresa: "${businessName}". Descrição: "${description}". Região de atuação: "${region || "Brasil"}". Gere JSON exato com as chaves: heroTitle, heroSubtitle, aboutTitle, aboutText, contactCall. Textos curtos, persuasivos e com linguagem natural para o público brasileiro da região informada.`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\\n/g, "").trim());
  } catch (error) { throw new HttpsError("internal", error.message); }
});

// ============================================================================
// ============================================================================
// MOTOR DE IMAGEM POR IA (OPENAI DALL-E 3)
// ============================================================================
exports.generateImage = onCall({ cors: true, timeoutSeconds: 120, secrets: [openAiKey] }, async (request) => {
  const uid = ensureAuthed(request); 
  const { prompt } = request.data;
  
  if (!prompt) throw new HttpsError("invalid-argument", "O descritivo da imagem é obrigatório.");

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAiKey.value()}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        style: "natural", // <- O BOTÃO MÁGICO DO REALISMO
        prompt: "A highly realistic, professional full-frame photograph of: " + prompt + ". Shot with a high-end DSLR camera, 85mm lens, natural cinematic lighting, lifelike textures. STRICTLY REAL LIFE PHOTOGRAPHY. ABSOLUTELY NO film borders, NO film strips, NO camera UI, NO text, NO watermarks, NO polaroid frames, NO split screens, NO 3D render, NO illustration.",
        n: 1,
        size: "1024x1024"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro OpenAI:", errorData);
      throw new HttpsError("internal", "A IA não conseguiu gerar a imagem. Tente outra descrição.");
    }

    const data = await response.json();
    return { imageUrl: data.data[0].url };
    
  } catch (error) {
    console.error("Falha no gerador de imagens:", error);
    throw new HttpsError("internal", error.message);
  }
});
// ============================================================================
// MOTOR DE LOGOMARCAS POR IA (OPENAI DALL-E 3) - DESIGN GRÁFICO
// ============================================================================
exports.generateLogo = onCall({ cors: true, timeoutSeconds: 120, secrets: [openAiKey] }, async (request) => {
  const uid = ensureAuthed(request); 
  const { prompt } = request.data;
  
  if (!prompt) throw new HttpsError("invalid-argument", "O descritivo do logo é obrigatório.");

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAiKey.value()}`
      },
      body: JSON.stringify({
        model: "dall-e-3", // Motor oficial e estável
        prompt: "A modern, minimalist flat vector logo design for: " + prompt + ". Clean lines, simple geometric shapes, solid white background, highly professional corporate identity. NO photorealism, NO 3D render, NO drop shadows, NO textures, NO words, NO letters, NO text.",
        n: 1,
        size: "1024x1024"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro OpenAI (Logo):", errorData);
      throw new HttpsError("internal", "A IA não conseguiu gerar o logo.");
    }

    const data = await response.json();
    return { imageUrl: data.data[0].url };
    
  } catch (error) {
    console.error("Falha no gerador de logos:", error);
    throw new HttpsError("internal", error.message);
  }
});
exports.checkDomainAvailability = onCall({ cors: true }, async (request) => {
  const { desiredDomain } = request.data || {};
  const cleanDomain = slugify(desiredDomain).slice(0, 30);
  const snap = await admin.firestore().collectionGroup("projects").where("hostingSiteId", "==", cleanDomain).get();
  if (!snap.empty) return { available: false, cleanDomain, message: "Já em uso." };
  return { available: true, cleanDomain };
});

exports.saveSiteProject = onCall({ cors: true, memory: "512MiB" }, async (request) => {
  const uid = ensureAuthed(request);
  const { businessName, internalDomain, officialDomain, generatedHtml, formData, aiContent } = request.data;
  const projectSlug = internalDomain; 

  // 1. A CORREÇÃO: Garante que o documento do usuário seja real (não-fantasma)
  await admin.firestore().collection("users").doc(uid).set({
    activeUser: true,
    uid: uid
  }, { merge: true });

  const hosting = await createHostingSiteIfPossible(projectSlug);
  await configureSiteRetention(projectSlug);

  const now = admin.firestore.FieldValue.serverTimestamp();
  
  // 2. Salva o projeto normalmente na subcoleção
  await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectSlug).set({
    uid, businessName, projectSlug, hostingSiteId: projectSlug, internalDomain,
    officialDomain: officialDomain || "Pendente", generatedHtml, formData: formData || {}, aiContent: aiContent || {},
    hosting, autoDeploy: true, needsDeploy: true, updatedAt: now, createdAt: now, 
    status: "draft", paymentStatus: "pending" 
  }, { merge: true });

  return { success: true, projectSlug, hostingSiteId: projectSlug };
});
exports.updateSiteProject = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const targetId = request.data.targetId || request.data.projectId || request.data.projectSlug;
  const { html, formData, aiContent } = request.data;
  
  await admin.firestore().collection("users").doc(uid).collection("projects").doc(targetId).update({
    generatedHtml: html, ...(formData && { formData }), ...(aiContent && { aiContent }),
    needsDeploy: true, updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

// Listagem blindada contra ocultação do banco de dados
exports.listUserProjects = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const snap = await admin.firestore().collection("users").doc(uid).collection("projects").get();
  
  const projects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  projects.sort((a, b) => {
    const timeA = a.updatedAt ? (a.updatedAt._seconds || a.updatedAt.seconds || 0) : 0;
    const timeB = b.updatedAt ? (b.updatedAt._seconds || b.updatedAt.seconds || 0) : 0;
    return timeB - timeA;
  });
  
  return { projects };
});

exports.publishUserProject = onCall({ cors: true, timeoutSeconds: 180, memory: "512MiB" }, async (request) => {
  try {
    const uid = ensureAuthed(request);
    const targetId = request.data.targetId || request.data.projectId || request.data.projectSlug;
    if (!targetId) throw new HttpsError("invalid-argument", "ID obrigatório.");

    const db = admin.firestore();
    const ref = db.collection("users").doc(uid).collection("projects").doc(targetId);
    const snap = await ref.get();
    
    if (!snap.exists) throw new HttpsError("not-found", "Projeto não encontrado.");
    const project = snap.data();

    const hostingProvision = await ensureHostingReady(project.hostingSiteId);
    const deployResult = await deployHtmlToFirebaseHosting(project.hostingSiteId, project.generatedHtml);
    const publicUrl = hostingProvision.defaultUrl || `https://${project.hostingSiteId}.web.app`;

    const isPaidProject = project.paymentStatus === "paid";
    let nextExpiresAt = project.expiresAt || null;

    if (!isPaidProject) {
      const trialExpiration = new Date();
      trialExpiration.setDate(trialExpiration.getDate() + 5); // 5 dias de trial
      nextExpiresAt = admin.firestore.Timestamp.fromDate(trialExpiration);
    }

    await ref.set({
      published: true, publishUrl: publicUrl, publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(nextExpiresAt ? { expiresAt: nextExpiresAt } : {}),
      status: "published", paymentStatus: isPaidProject ? "paid" : "trial", needsDeploy: false, lastDeploy: deployResult,
      hosting: { ...(project.hosting || {}), ...hostingProvision },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true, publishUrl: publicUrl, expiresAt: nextExpiresAt?.toDate?.()?.toISOString?.() || null };
  } catch (error) { throw new HttpsError("internal", error.message); }
});

exports.deleteUserProject = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const targetId = request.data.targetId || request.data.projectId || request.data.projectSlug;
  const ref = admin.firestore().collection("users").doc(uid).collection("projects").doc(targetId);
  const snap = await ref.get();

  if (snap.exists) {
    const siteId = snap.data().hostingSiteId;
    if (siteId) {
      try {
        const projectIdEnv = getProjectId();
        const token = await getFirebaseAccessToken();
        await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${siteId}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) { console.error("Falha ao deletar site no Hosting", e); }
    }
    await ref.delete();
  }
  return { success: true };
});


exports.createStripeCheckoutSession = onCall({ cors: true }, async (request) => {
  ensureAuthed(request);
  const { projectId, origin } = request.data || {};
  if (!projectId) throw new HttpsError("invalid-argument", "projectId é obrigatório.");

  const safeOrigin = origin && /^https?:\/\//.test(origin) ? origin : "https://sitecraft-ai.web.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "brl",
        product_data: {
          name: "Plano anual SiteCraft",
          description: "Hospedagem e manutenção por 12 meses"
        },
        unit_amount: 49900
      },
      quantity: 1
    }],
    locale: "pt-BR",
    client_reference_id: projectId,
    success_url: `${safeOrigin}?payment=success&project=${projectId}`,
    cancel_url: `${safeOrigin}?payment=cancelled&project=${projectId}`
  });

  return { url: session.url };
});

// ==============================================================================
// WEBHOOK DA STRIPE (COM RASTREIO E LOG DE PAYLOAD)
// ==============================================================================
exports.stripeWebhook = onRequest({ cors: true }, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = "whsec_s0sKkzYh75uyzOgD7j2N9AKJ6BogsUum"; 

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Erro na assinatura:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[WEBHOOK] Evento disparado: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const projectId = session.client_reference_id; 

    // O RASTREADOR DE PAYLOAD: Mostra exatamente o que a Stripe enviou
    console.log(`[STRIPE PAYLOAD] Dados recebidos:`, JSON.stringify({
      sessionId: session.id,
      cliente_email: session.customer_details?.email,
      status_pagamento: session.payment_status,
      ID_DO_PROJETO_RECEBIDO: projectId
    }, null, 2));

    if (projectId) {
      try {
        const db = admin.firestore();
        const usersSnap = await db.collection("users").get();
        let encontrouProjeto = false;
        
        for (const userDoc of usersSnap.docs) {
          const projectRef = db.collection("users").doc(userDoc.id).collection("projects").doc(projectId);
          const pDoc = await projectRef.get();
          
          if (pDoc.exists) {
            encontrouProjeto = true;
            const newExpiration = new Date();
            newExpiration.setDate(newExpiration.getDate() + 365); 

            await projectRef.update({
              status: "published", 
              paymentStatus: "paid", // Aqui a mágica de sumir o botão acontece
              expiresAt: admin.firestore.Timestamp.fromDate(newExpiration),
              needsDeploy: true 
            });
            
            console.log(`✅ SUCESSO! Projeto ${projectId} atualizado para 1 ANO PAGO.`);
            break; 
          }
        }

        if (!encontrouProjeto) {
          console.error(`⚠️ ALERTA: A Stripe mandou o ID "${projectId}", mas ele não foi achado no banco.`);
        }
      } catch (error) {
        console.error(`❌ Erro ao escrever no banco de dados:`, error);
      }
    } else {
      console.error("⚠️ ALERTA: Pagamento concluído, mas a Stripe NÃO DEVOLVEU o client_reference_id.");
    }
  }

  res.status(200).send({ received: true });
});

// ==============================================================================
// CRON JOB DIÁRIO
// ==============================================================================
exports.cleanupExpiredSites = onSchedule("every 24 hours", async (event) => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const token = await getFirebaseAccessToken();
  const projectIdEnv = getProjectId();
  
  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const projectsSnap = await db.collection("users").doc(userDoc.id).collection("projects").where("expiresAt", "<=", now).get();
    for (const doc of projectsSnap.docs) {
      const data = doc.data();
      if (data.status !== "frozen") {
        try {
          await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${data.hostingSiteId}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {}
        await doc.ref.update({ status: "frozen", paymentStatus: "expired", published: false });
      }
    }
  }
});
