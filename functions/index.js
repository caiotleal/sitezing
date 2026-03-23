const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
const { onRequest } = require("firebase-functions/v2/https");

const stripe = require("stripe")("sk_test_51T3iV5LK0sp6cEMAbpSV1cM4MGESQ9s3EOffFfpUuiU0cbinuy64HCekpoyfAuWZy1gemNFcSpgF1cKPgHDM3pf500vcGP7tGW");

if (!admin.apps.length) admin.initializeApp();

const geminiKey = defineSecret("GEMINI_KEY");

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

async function getFirebaseAccessToken() {
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/firebase"] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token || token;
}

// ============================================================================
// INFRAESTRUTURA: ROTEADOR MULTI-TENANT (O SEGREDO DA ESCALABILIDADE)
// ============================================================================
async function ensureRouterSiteReady() {
  const projectId = getProjectId();
  const masterSite = `${projectId}-router`; 
  const token = await getFirebaseAccessToken();

  try {
    await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectId}/sites?siteId=${masterSite}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "USER_SITE" }),
    });

    const createVersion = await fetch(`https://firebasehosting.googleapis.com/v1beta1/sites/${masterSite}/versions`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ config: { rewrites: [{ glob: "**", function: "servesite" }] } }),
    });
    const version = await createVersion.json();

    await fetch(`https://firebasehosting.googleapis.com/v1beta1/${version.name}?updateMask=status`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "FINALIZED" }),
    });

    await fetch(`https://firebasehosting.googleapis.com/v1beta1/sites/${masterSite}/releases?versionName=${encodeURIComponent(version.name)}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Roteador Multi-Tenant Master Ativo" }),
    });
  } catch (error) { console.error("[ROUTER SETUP ERROR]:", error); }

  return masterSite;
}

// A CLOUD FUNCTION QUE INTERCEPTA E RENDERIZA TODOS OS SITES DO MUNDO
exports.servesite = onRequest({ cors: true, timeoutSeconds: 15, memory: "256MiB" }, async (req, res) => {
  try {
    const host = req.hostname.replace(/^www\./, '').toLowerCase();
    const db = admin.firestore();
    let projectSnap;

    // 1. Domínio da plataforma (ex: eletricista.sitezing.com.br)
    if (host.includes('sitezing.com.br')) {
      const slug = host.split('.')[0]; 
      if (!slug || slug === 'sitezing' || slug === 'www') {
        return res.status(200).send("<h1>SiteZing Master Roteador Ativo 🚀</h1>");
      }
      projectSnap = await db.collectionGroup("projects").where("projectSlug", "==", slug).limit(1).get();
    } 
    // 2. URL Fallback do Firebase (ex: roteador.web.app/eletricista)
    else if (host.includes('web.app') || host.includes('firebaseapp.com')) {
      const slug = req.path.split('/')[1]; 
      if (!slug) return res.status(200).send("<h1>SiteZing Cloud Roteador Ativo 🚀</h1>");
      projectSnap = await db.collectionGroup("projects").where("projectSlug", "==", slug).limit(1).get();
    } 
    // 3. Domínio Customizado do Cliente (ex: casacaiu.com.br)
    else {
      projectSnap = await db.collectionGroup("projects").where("officialDomain", "==", host).limit(1).get();
    }

    if (!projectSnap || projectSnap.empty) {
      return res.status(404).send("<html><body style='text-align:center; padding:50px; font-family:sans-serif;'><h1>404 - Site não encontrado</h1><p>Verifique o endereço e tente novamente.</p></body></html>");
    }

    const project = projectSnap.docs[0].data();

    if (project.status === "frozen") {
      return res.status(403).send("<html><body style='text-align:center; padding:50px; font-family:sans-serif; background:#FFF7ED; color:#9A3412;'><h1>Site Temporariamente Inativo</h1><p>O administrador deste site precisa renovar o plano.</p></body></html>");
    }

    res.status(200).send(project.generatedHtml);
  } catch (error) {
    console.error("Router error:", error);
    res.status(500).send(`Erro interno no Roteador: ${error.message}`);
  }
});

// ============================================================================
// INTELIGÊNCIA ARTIFICIAL E GESTÃO DE PROJETOS
// ============================================================================
exports.generateSite = onCall({ cors: true, timeoutSeconds: 60, memory: "256MiB", secrets: [geminiKey] }, async (request) => {
  const genAI = getGeminiClient();
  const { businessName, description, region } = request.data;
  if (!businessName) throw new HttpsError("invalid-argument", "Nome obrigatório");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
  const prompt = `Atue como um redator publicitário sênior. Empresa: "${businessName}". Descrição: "${description}". Região de atuação: "${region || "Brasil"}". Gere JSON exato com as chaves: heroTitle, heroSubtitle, aboutTitle, aboutText, contactCall. Textos curtos, persuasivos e com linguagem natural.`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\\n/g, "").trim());
  } catch (error) { throw new HttpsError("internal", error.message); }
});

exports.generateImage = onCall({ cors: true, timeoutSeconds: 120, secrets: [geminiKey] }, async (request) => {
  ensureAuthed(request);
  const { prompt } = request.data;
  if (!prompt) throw new HttpsError("invalid-argument", "O descritivo da imagem é obrigatório.");

  try {
    const refinedPrompt = `A high-end, realistic commercial photograph of: ${prompt}. Shot on a 35mm lens, natural lighting, authentic detailed textures, 8k resolution. Pure photography.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${geminiKey.value()}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [{ prompt: refinedPrompt }], parameters: { sampleCount: 1, aspectRatio: "1:1" } })
    });
    const data = await response.json();
    return { imageUrl: `data:${data.predictions[0].mimeType || "image/jpeg"};base64,${data.predictions[0].bytesBase64Encoded}` };
  } catch (error) { throw new HttpsError("internal", error.message); }
});

exports.saveSiteProject = onCall({ cors: true, memory: "512MiB" }, async (request) => {
  const uid = ensureAuthed(request);
  const { businessName, officialDomain, generatedHtml, formData, aiContent } = request.data;
  
  let safeBaseName = slugify(businessName).slice(0, 20); 
  if (!safeBaseName) safeBaseName = "site";
  const projectSlug = `${safeBaseName}-${Math.random().toString(36).substring(2, 6)}`;

  await admin.firestore().collection("users").doc(uid).set({ activeUser: true, uid: uid }, { merge: true });

  const now = admin.firestore.FieldValue.serverTimestamp();
  await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectSlug).set({
    uid, businessName, projectSlug,
    officialDomain: officialDomain || "Pendente", generatedHtml, formData: formData || {}, aiContent: aiContent || {},
    updatedAt: now, createdAt: now, status: "draft", paymentStatus: "pending"
  }, { merge: true });

  return { success: true, projectSlug };
});

exports.updateSiteProject = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const targetId = request.data.targetId || request.data.projectId || request.data.projectSlug;
  const { html, formData, aiContent } = request.data;

  await admin.firestore().collection("users").doc(uid).collection("projects").doc(targetId).update({
    generatedHtml: html, ...(formData && { formData }), ...(aiContent && { aiContent }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

exports.listUserProjects = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const snap = await admin.firestore().collection("users").doc(uid).collection("projects").get();
  const projects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  projects.sort((a, b) => (b.updatedAt?._seconds || 0) - (a.updatedAt?._seconds || 0));
  return { projects };
});

exports.publishUserProject = onCall({ cors: true }, async (request) => {
  try {
    const uid = ensureAuthed(request);
    const targetId = request.data.targetId || request.data.projectId || request.data.projectSlug;

    const db = admin.firestore();
    const ref = db.collection("users").doc(uid).collection("projects").doc(targetId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Projeto não encontrado.");
    const project = snap.data();

    if (project.status === "frozen") throw new HttpsError("permission-denied", "Site congelado. Renove o plano.");

    await ensureRouterSiteReady();
    
    // GERA A URL COM O DOMÍNIO DA PLATAFORMA
    const publicUrl = `https://${project.projectSlug}.sitezing.com.br`;

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
    const project = snap.data();
    if (project.officialDomain && project.officialDomain !== "Pendente") {
      try {
        const projectIdEnv = getProjectId();
        const masterSite = `${projectIdEnv}-router`;
        const token = await getFirebaseAccessToken();
        await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${masterSite}/customDomains/${project.officialDomain}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
        await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${masterSite}/customDomains/www.${project.officialDomain}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
      } catch (e) {}
    }
    await ref.delete();
  }
  return { success: true };
});

// ==============================================================================
// GESTÃO DE DOMÍNIOS PERSONALIZADOS (NO ROTEADOR MASTER)
// ==============================================================================
exports.addCustomDomain = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data; 
  
  if (!projectId || !domain) throw new HttpsError("invalid-argument", "Projeto e Domínio são obrigatórios.");

  try {
    const projectIdEnv = getProjectId();
    const masterSite = `${projectIdEnv}-router`; 
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${masterSite}/customDomains?customDomainId=${cleanDomain}`;

    const response = await fetch(apiUrl, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({}) 
    });

    const domainData = await response.json();

    if (!response.ok) {
      if (domainData.error?.status === "ALREADY_EXISTS") throw new HttpsError("already-exists", "Este domínio já está em uso.");
      throw new HttpsError("unknown", `Erro Google: ${domainData.error?.message}`);
    }

    const wwwUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${masterSite}/customDomains?customDomainId=www.${cleanDomain}`;
    await fetch(wwwUrl, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ redirectTarget: cleanDomain })
    });

    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      officialDomain: cleanDomain,
      domainStatus: domainData.hostState || domainData.status || "PENDING",
      domainRecords: domainData.requiredDnsUpdates || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, status: domainData.hostState || "PENDING", records: domainData.requiredDnsUpdates };
  } catch (error) { throw new HttpsError(error.code || "unknown", error.message); }
});

exports.removeCustomDomain = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data;
  if (!projectId || !domain) throw new HttpsError("invalid-argument", "Dados obrigatórios.");

  try {
    const projectIdEnv = getProjectId();
    const masterSite = `${projectIdEnv}-router`;
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${masterSite}/customDomains/${cleanDomain}`, {
      method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
    });
    await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${masterSite}/customDomains/www.${cleanDomain}`, {
      method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
    });

    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      officialDomain: "Pendente", domainStatus: "PENDING", domainRecords: null, updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) { throw new HttpsError(error.code || "unknown", error.message); }
});

exports.verifyDomainPropagation = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data;
  if (!projectId || !domain) throw new HttpsError("invalid-argument", "Dados obrigatórios.");

  try {
    const projectIdEnv = getProjectId();
    const masterSite = `${projectIdEnv}-router`;
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${masterSite}/customDomains/${cleanDomain}`;
    const response = await fetch(apiUrl, { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
    const domainData = await response.json();

    if (!response.ok) throw new HttpsError("unknown", `Erro Google: ${domainData.error?.message}`);

    const isPropagated = domainData.hostState === "HOSTING_ACTIVE" || domainData.status === "ACTIVE";

    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      domainStatus: domainData.hostState || domainData.status || "PENDING",
      domainRecords: domainData.requiredDnsUpdates || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, status: domainData.hostState || domainData.status || "PENDING", isPropagated: isPropagated, records: domainData.requiredDnsUpdates };
  } catch (error) { throw new HttpsError(error.code || "unknown", error.message); }
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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription", payment_method_types: ["card"],
    line_items: [{
      price_data: { currency: "brl", product_data: { name: `SiteZing - Plano ${isAnual ? 'Anual' : 'Mensal'}`, description: isAnual ? "Hospedagem e manutenção por 12 meses" : "Hospedagem e manutenção mensal" }, unit_amount: amount, recurring: { interval: isAnual ? "year" : "month" } },
      quantity: 1
    }],
    metadata: { planType: isAnual ? 'anual' : 'mensal' }, locale: "pt-BR", client_reference_id: projectId,
    success_url: `${safeOrigin}?payment=success&project=${projectId}`, cancel_url: `${safeOrigin}?payment=cancelled&project=${projectId}`
  });

  return { url: session.url };
});

exports.stripeWebhook = onRequest({ cors: true }, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = "whsec_s0sKkzYh75uyzOgD7j2N9AKJ6BogsUum";

  let event;
  try { event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret); } 
  catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const projectId = session.client_reference_id;
    const planType = session.metadata?.planType || 'anual';

    if (projectId) {
      try {
        const db = admin.firestore();
        const usersSnap = await db.collection("users").get();

        for (const userDoc of usersSnap.docs) {
          const projectRef = db.collection("users").doc(userDoc.id).collection("projects").doc(projectId);
          const pDoc = await projectRef.get();

          if (pDoc.exists) {
            const projectData = pDoc.data();
            if (projectData.stripeSubscriptionId && session.subscription && projectData.stripeSubscriptionId !== session.subscription) {
              try { await stripe.subscriptions.cancel(projectData.stripeSubscriptionId); } catch (err) {}
            }

            const newExpiration = new Date();
            planType === 'anual' ? newExpiration.setFullYear(newExpiration.getFullYear() + 1) : newExpiration.setMonth(newExpiration.getMonth() + 1);

            await projectRef.update({
              status: "published", paymentStatus: "paid", planSelected: planType, stripeSubscriptionId: session.subscription || null,
              expiresAt: admin.firestore.Timestamp.fromDate(newExpiration), updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            break; 
          }
        }
      } catch (error) { console.error(`❌ Erro no banco:`, error); }
    }
  }
  res.status(200).send({ received: true });
});

exports.cancelStripeSubscription = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId } = request.data;
  const projectRef = admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId);
  const snap = await projectRef.get();
  const project = snap.data();

  if (!project?.stripeSubscriptionId) throw new HttpsError("failed-precondition", "Assinatura não vinculada.");
  try {
    await stripe.subscriptions.update(project.stripeSubscriptionId, { cancel_at_period_end: true });
    await projectRef.update({ cancelAtPeriodEnd: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true };
  } catch (error) { throw new HttpsError("internal", "Erro provedor de pagamentos."); }
});

exports.resumeStripeSubscription = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId } = request.data;
  const projectRef = admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId);
  const snap = await projectRef.get();
  const project = snap.data();

  if (!project?.stripeSubscriptionId) throw new HttpsError("failed-precondition", "Sem assinatura ativa.");
  try {
    await stripe.subscriptions.update(project.stripeSubscriptionId, { cancel_at_period_end: false });
    await projectRef.update({ cancelAtPeriodEnd: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true };
  } catch (error) { throw new HttpsError("internal", "Erro provedor de pagamentos."); }
});

exports.cleanupExpiredSites = onSchedule("every 24 hours", async (event) => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const projectsSnap = await db.collection("users").doc(userDoc.id).collection("projects").where("expiresAt", "<=", now).get();
    for (const doc of projectsSnap.docs) {
      if (doc.data().status !== "frozen") {
        await doc.ref.update({ status: "frozen", paymentStatus: "expired" });
      }
    }
  }
});
