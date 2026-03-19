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
const openAiKey = defineSecret("OPENAI_KEY");

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

exports.generateImage = onCall({ cors: true, timeoutSeconds: 120, secrets: [geminiKey] }, async (request) => {
  const uid = ensureAuthed(request);
  const { prompt } = request.data;

  if (!prompt) throw new HttpsError("invalid-argument", "O descritivo da imagem é obrigatório.");

  try {
    const refinedPrompt = `A high-end, realistic commercial photograph of: ${prompt}. Shot on a 35mm lens, natural lighting, authentic detailed textures, 8k resolution. This is a raw, unedited photograph, NOT a 3d render. Absolutely no text, no interface, no borders, pure photography.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${geminiKey.value()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: refinedPrompt }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" }
      })
    });

    if (!response.ok) {
      throw new HttpsError("internal", "A IA não conseguiu gerar a imagem. Tente outra descrição.");
    }

    const data = await response.json();
    if (!data.predictions || data.predictions.length === 0) {
      throw new HttpsError("internal", "Nenhuma imagem foi retornada pela API.");
    }

    const base64Image = data.predictions[0].bytesBase64Encoded;
    const mimeType = data.predictions[0].mimeType || "image/jpeg";
    return { imageUrl: `data:${mimeType};base64,${base64Image}` };
  } catch (error) {
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
  
  let safeBaseName = slugify(businessName).slice(0, 20); 
  if (!safeBaseName) safeBaseName = "site";
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const projectSlug = `${safeBaseName}-${randomSuffix}`;

  await admin.firestore().collection("users").doc(uid).set({ activeUser: true, uid: uid }, { merge: true });

  const hosting = await createHostingSiteIfPossible(projectSlug);
  if (hosting.status === "error") {
      throw new HttpsError("internal", `Erro ao provisionar ambiente: ${hosting.message}`);
  }
  await configureSiteRetention(projectSlug);

  const now = admin.firestore.FieldValue.serverTimestamp();

  await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectSlug).set({
    uid, businessName, projectSlug, hostingSiteId: projectSlug, internalDomain: projectSlug,
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

    if (project.status === "frozen") {
      throw new HttpsError("permission-denied", "Seu site está congelado, para ativar selecione um dos nossos planos.");
    }

    const hostingProvision = await ensureHostingReady(project.hostingSiteId);
    const deployResult = await deployHtmlToFirebaseHosting(project.hostingSiteId, project.generatedHtml);
    const publicUrl = hostingProvision.defaultUrl || `https://${project.hostingSiteId}.web.app`;

    const isPaidProject = project.paymentStatus === "paid";
    let nextExpiresAt = project.expiresAt || null;

    if (!isPaidProject && !nextExpiresAt) {
      const trialExpiration = new Date();
      trialExpiration.setDate(trialExpiration.getDate() + 7);
      nextExpiresAt = admin.firestore.Timestamp.fromDate(trialExpiration);
    }

    await ref.set({
      published: true, 
      publishUrl: publicUrl, 
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(nextExpiresAt ? { expiresAt: nextExpiresAt } : {}),
      status: "published", 
      paymentStatus: isPaidProject ? "paid" : "trial", 
      needsDeploy: false, 
      lastDeploy: deployResult,
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

// ==============================================================================
// GESTÃO DE DOMÍNIOS PERSONALIZADOS E DNS
// ==============================================================================
// ==============================================================================
// GESTÃO DE DOMÍNIOS PERSONALIZADOS E DNS (API NOVA: customDomains)
// ==============================================================================
exports.addCustomDomain = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data; 
  
  if (!projectId || !domain) {
    throw new HttpsError("invalid-argument", "Projeto e Domínio são obrigatórios.");
  }

  try {
    const projectIdEnv = getProjectId();
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    // MUDANÇA DE PARADIGMA: Usando a API moderna 'customDomains' que o console do Firebase utiliza.
    // Ela aceita domínios virgens e gera a chave TXT automaticamente para nós.
    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectId}/customDomains?customDomainId=${cleanDomain}`;

    console.log(`[DNS DEBUG] API Moderna Endpoint: ${apiUrl}`);

    // 1. Cria o domínio principal
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({}) // A API moderna aceita o objeto vazio e entende tudo pela URL!
    });

    const domainData = await response.json();

    if (!response.ok) {
      console.error("[DNS ERROR] Raiz:", domainData);
      if (domainData.error?.status === "ALREADY_EXISTS") {
        throw new HttpsError("already-exists", "Este domínio já está em uso.");
      }
      throw new HttpsError("unknown", `Erro Google (Raiz): ${domainData.error?.message}`);
    }

    // 2. Cria o subdomínio WWW com redirecionamento
    const wwwUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectId}/customDomains?customDomainId=www.${cleanDomain}`;
    
    const wwwResponse = await fetch(wwwUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        redirectTarget: cleanDomain // Já vincula o redirecionamento 301 para a raiz
      })
    });

    if (!wwwResponse.ok) {
      console.error("[DNS ERROR] Falha não crítica no WWW:", await wwwResponse.json());
    }

    // 3. Salva no banco de dados para a tela do cliente puxar
    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      officialDomain: cleanDomain,
      domainStatus: domainData.hostState || domainData.status || "PENDING",
      domainRecords: domainData.requiredDnsUpdates || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, status: domainData.hostState || "PENDING", records: domainData.requiredDnsUpdates };
  } catch (error) {
    console.error("[DNS CATCH ERROR]:", error);
    throw new HttpsError(error.code || "unknown", error.message);
  }
});

exports.verifyDomainPropagation = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data;

  if (!projectId || !domain) {
    throw new HttpsError("invalid-argument", "Projeto e Domínio são obrigatórios.");
  }

  try {
    const projectIdEnv = getProjectId();
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    // Rota da API moderna para verificação
    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectId}/customDomains/${cleanDomain}`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const domainData = await response.json();

    if (!response.ok) {
      console.error("[DNS VERIFY ERROR]:", domainData);
      throw new HttpsError("unknown", `Erro Google (Verificação): ${domainData.error?.message}`);
    }

    const isPropagated = domainData.hostState === "HOSTING_ACTIVE" || domainData.status === "ACTIVE";

    // Atualiza o banco com o novo status
    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      domainStatus: domainData.hostState || domainData.status || "PENDING",
      domainRecords: domainData.requiredDnsUpdates || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      status: domainData.hostState || domainData.status || "PENDING", 
      isPropagated: isPropagated,
      records: domainData.requiredDnsUpdates
    };
  } catch (error) {
    console.error("[DNS VERIFY CATCH ERROR]:", error);
    throw new HttpsError(error.code || "unknown", error.message);
  }
});

// Remover dominio//
exports.removeCustomDomain = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data;

  if (!projectId || !domain) {
    throw new HttpsError("invalid-argument", "Projeto e Domínio são obrigatórios.");
  }

  try {
    const projectIdEnv = getProjectId();
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    // Deleta o domínio raiz e o www da API moderna do Firebase
    const rootUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectId}/customDomains/${cleanDomain}`;
    const wwwUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectId}/customDomains/www.${cleanDomain}`;

    await fetch(rootUrl, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
    await fetch(wwwUrl, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });

    // Limpa o banco de dados
    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      officialDomain: "Pendente",
      domainStatus: "PENDING",
      domainRecords: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error("[DNS REMOVE ERROR]:", error);
    throw new HttpsError(error.code || "unknown", error.message);
  }
});
// ==============================================================================
// STRIPE CHECKOUT E MENSALIDADE
// ==============================================================================
exports.createStripeCheckoutSession = onCall({ cors: true }, async (request) => {
  ensureAuthed(request);
  const { projectId, origin, planType } = request.data || {};
  if (!projectId) throw new HttpsError("invalid-argument", "projectId é obrigatório.");

  const safeOrigin = origin && /^https?:\/\//.test(origin) ? origin : "https://sitecraft-ai.web.app";

  const isAnual = planType === 'anual';
  const amount = isAnual ? 49900 : 4990;
  const interval = isAnual ? "year" : "month";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "brl",
        product_data: {
          name: `SiteCraft - Plano ${isAnual ? 'Anual' : 'Mensal'}`,
          description: isAnual ? "Hospedagem e manutenção por 12 meses" : "Hospedagem e manutenção mensal"
        },
        unit_amount: amount,
        recurring: { interval: interval }
      },
      quantity: 1
    }],
    metadata: { planType: isAnual ? 'anual' : 'mensal' },
    locale: "pt-BR",
    client_reference_id: projectId,
    success_url: `${safeOrigin}?payment=success&project=${projectId}`,
    cancel_url: `${safeOrigin}?payment=cancelled&project=${projectId}`
  });

  return { url: session.url };
});

// ==============================================================================
// WEBHOOK DA STRIPE (LÓGICA BLINDADA DE UPGRADE)
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const projectId = session.client_reference_id;
    const planType = session.metadata?.planType || 'anual';

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
            
            const projectData = pDoc.data();
            const oldSubscriptionId = projectData.stripeSubscriptionId;
            const newSubscriptionId = session.subscription;

            // MÁGICA DO UPGRADE: Cancela assinatura antiga automaticamente
            if (oldSubscriptionId && newSubscriptionId && oldSubscriptionId !== newSubscriptionId) {
              try {
                await stripe.subscriptions.cancel(oldSubscriptionId);
                console.log(`[UPGRADE] Assinatura anterior cancelada.`);
              } catch (err) {
                console.error("Erro ao cancelar assinatura antiga:", err.message);
              }
            }

            const newExpiration = new Date();
            if (planType === 'anual') {
              newExpiration.setFullYear(newExpiration.getFullYear() + 1);
            } else {
              newExpiration.setMonth(newExpiration.getMonth() + 1);
            }

            await projectRef.update({
              status: "published",
              paymentStatus: "paid",
              planSelected: planType,
              stripeSubscriptionId: newSubscriptionId || null,
              expiresAt: admin.firestore.Timestamp.fromDate(newExpiration),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              needsDeploy: true
            });

            console.log(`✅ SUCESSO! Projeto ${projectId} atualizado para: ${planType.toUpperCase()}`);
            break; 
          }
        }

        if (!encontrouProjeto) console.error(`⚠️ Projeto ${projectId} não encontrado.`);
      } catch (error) {
        console.error(`❌ Erro no banco:`, error);
      }
    }
  }

  res.status(200).send({ received: true });
});

// ==============================================================================
// CANCELAMENTO DE ASSINATURA (FIM DO CICLO)
// ==============================================================================
exports.cancelStripeSubscription = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId } = request.data;
  if (!projectId) throw new HttpsError("invalid-argument", "projectId é obrigatório.");

  const db = admin.firestore();
  const projectRef = db.collection("users").doc(uid).collection("projects").doc(projectId);
  const snap = await projectRef.get();

  if (!snap.exists) throw new HttpsError("not-found", "Projeto não encontrado.");
  const project = snap.data();

  if (!project.stripeSubscriptionId) {
    throw new HttpsError("failed-precondition", "Assinatura não vinculada ou já cancelada.");
  }

  try {
    await stripe.subscriptions.update(project.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    await projectRef.update({
      cancelAtPeriodEnd: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error.message);
    throw new HttpsError("internal", "Erro ao comunicar com o provedor de pagamentos.");
  }
});

// ==============================================================================
// RETOMAR ASSINATURA (DESFAZER CANCELAMENTO)
// ==============================================================================
exports.resumeStripeSubscription = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId } = request.data;
  if (!projectId) throw new HttpsError("invalid-argument", "projectId é obrigatório.");

  const db = admin.firestore();
  const projectRef = db.collection("users").doc(uid).collection("projects").doc(projectId);
  const snap = await projectRef.get();

  if (!snap.exists) throw new HttpsError("not-found", "Projeto não encontrado.");
  const project = snap.data();

  if (!project.stripeSubscriptionId) {
    throw new HttpsError("failed-precondition", "Nenhuma assinatura ativa encontrada.");
  }

  try {
    await stripe.subscriptions.update(project.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    await projectRef.update({
      cancelAtPeriodEnd: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao retomar assinatura:", error.message);
    throw new HttpsError("internal", "Erro ao comunicar com o provedor de pagamentos.");
  }
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
        } catch (e) { }
        await doc.ref.update({ status: "frozen", paymentStatus: "expired", published: false });
      }
    }
  }
});
