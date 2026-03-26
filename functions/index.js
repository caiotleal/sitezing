const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https"); 
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");

const Stripe = require("stripe");

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
// NOVO MOTOR DE ENTREGA RÁPIDA REACT (WILDCARD)
// ============================================================================
exports.getSiteContent = onCall({ cors: true }, async (request) => {
  const { domain } = request.data;
  if (!domain) throw new HttpsError("invalid-argument", "Domínio não informado.");

  const db = admin.firestore();
  let projectSnap;
  const cleanHost = domain.replace(/^www\./, '').toLowerCase();

  // Se for o subdomínio gratuito da plataforma (ex: nome.sitezing.com.br)
  if (cleanHost.endsWith('.sitezing.com.br')) {
    const slug = cleanHost.replace('.sitezing.com.br', '');
    
    // Busca Inteligente: Procura pelo ID, Slug ou Internal Domain para não dar erro 404
    projectSnap = await db.collectionGroup("projects").where("projectSlug", "==", slug).limit(1).get();
    if (projectSnap.empty) {
        projectSnap = await db.collectionGroup("projects").where("internalDomain", "==", slug).limit(1).get();
    }
  } else {
    // Se for o domínio customizado oficial do cliente (ex: casacaiu.com.br)
    projectSnap = await db.collectionGroup("projects").where("officialDomain", "==", cleanHost).limit(1).get();
  }

  if (!projectSnap || projectSnap.empty) {
    throw new HttpsError("not-found", "O site não foi encontrado no banco de dados.");
  }

  const project = projectSnap.docs[0].data();

  // Trava de Site Congelado
  if (project.status === "frozen") {
    throw new HttpsError("permission-denied", "Este site encontra-se temporariamente suspenso.");
  }

  let html = project.generatedHtml || "";

  // Injeção de CSS Manual (Zing! Instant)
  if (project.manualCss) {
    const styleTag = `<style id="admin-manual-css">${project.manualCss}</style>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${styleTag}</head>`);
    } else {
      html = styleTag + html;
    }
  }

  return { html };
});

// ============================================================================
// INTELIGÊNCIA ARTIFICIAL E GESTÃO DE PROJETOS
// ============================================================================
exports.generateSite = onCall({ cors: true, timeoutSeconds: 60, memory: "256MiB", secrets: [geminiKey] }, async (request) => {
  const genAI = getGeminiClient();
  const { businessName, description, region, googleContext } = request.data;
  if (!businessName) throw new HttpsError("invalid-argument", "Nome obrigatório");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
  let prompt = `Atue como um redator publicitário sênior. Empresa: "${businessName}". Descrição: "${description}". Região de atuação: "${region || "Brasil"}". Gere JSON exato com as chaves: heroTitle, heroSubtitle, aboutTitle, aboutText, contactCall. Textos curtos, persuasivos e com linguagem natural.`;
  
  if (googleContext) {
    prompt += ` Integre naturalmente também as seguintes informações reais do perfil e avaliações do Google Maps desta empresa para criar uma comunicação verdadeira e social proof: ${googleContext}`;
  }

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
  const { businessName, officialDomain, internalDomain, generatedHtml, formData, aiContent } = request.data;
  
  // Confia na URL gerada pelo painel React do usuário ou cria um slug fixo
  let projectSlug = internalDomain || slugify(businessName).slice(0, 30);

  // Validação Backend: Garante que não duplica URL de NENHUM outro cliente
  const snap = await admin.firestore().collectionGroup("projects").where("projectSlug", "==", projectSlug).limit(1).get();
  if (!snap.empty) {
     const existingOwnerId = snap.docs[0].ref.parent.parent.id;
     if (existingOwnerId !== uid) {
         // O site já existe MAS pertence a outro dono. Adicionamos hash curto.
         const shortHash = Math.random().toString(36).substring(2, 6);
         projectSlug = `${projectSlug}-${shortHash}`;
     }
  }

  await admin.firestore().collection("users").doc(uid).set({ activeUser: true, uid: uid }, { merge: true });

  const now = admin.firestore.FieldValue.serverTimestamp();
  await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectSlug).set({
    uid, businessName, projectSlug, internalDomain: projectSlug,
    officialDomain: officialDomain || "Pendente", generatedHtml, formData: formData || {}, aiContent: aiContent || {},
    updatedAt: now, createdAt: now, status: "draft", paymentStatus: "pending"
  }, { merge: true });

  return { success: true, projectSlug };
});

exports.checkDomainAvailability = onCall({ cors: true }, async (request) => {
  try {
    const { projectSlug } = request.data || {};
    
    if (!projectSlug) {
      return { available: false, error: "Slug não informado." };
    }
    
    // Tratamento estrito do texto para ficar no padrão web domínio:
    // minúsculo, sem acentos, sem espaços e apenas letras/números/hífens
    const cleanSlug = slugify(projectSlug).slice(0, 30);
    
    const db = admin.firestore();
    const snap = await db.collectionGroup("projects").where("projectSlug", "==", cleanSlug).limit(1).get();
    
    return { available: snap.empty, checkedSlug: cleanSlug };
  } catch (error) {
    console.error("Erro no checkDomainAvailability:", error);
    // Para depuração, retornamos o erro ao invés de crashar a function
    return { available: false, error: error.message };
  }
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
    
    // GERA A URL OFICIAL USANDO O WILDCARD
    const subdomainVal = `${project.projectSlug}.sitezing.com.br`;
    const publicUrl = `https://${subdomainVal}`;

    // REGISTRA O SUBDOMÍNIO NO FIREBASE HOSTING PARA SSL E ROTEAMENTO
    if (!project.published) {
      try {
        const projectIdEnv = getProjectId();
        const token = await getFirebaseAccessToken();
        const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains?customDomainId=${subdomainVal}`;
        await fetch(apiUrl, {
          method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}) 
        });
      } catch (apiError) {
        console.error("Erro ao registrar subdomínio no Hosting da nuvem Firebase:", apiError);
      }
    }

    const isPaidProject = project.paymentStatus === "paid";
    let nextExpiresAt = project.expiresAt || null;

    // Se NÃO for pago e NÃO tiver data de expiração, gera os 7 dias de teste
    if (!isPaidProject && !nextExpiresAt) {
      const trialExpiration = new Date();
      trialExpiration.setDate(trialExpiration.getDate() + 7);
      nextExpiresAt = admin.firestore.Timestamp.fromDate(trialExpiration);
    }

    // SE O TESTE JÁ VENCEU E NÃO FOI PAGO, NÃO PODE PUBLICAR
    if (!isPaidProject && nextExpiresAt) {
      const now = new Date();
      if (nextExpiresAt.toDate() < now) {
        throw new HttpsError("permission-denied", "Seu período de teste expirou. Por favor, realize o pagamento para manter seu site online.");
      }
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
    // Limpa domínios anexados ao projeto principal do Firebase se houver
    try {
      const projectIdEnv = getProjectId();
      const token = await getFirebaseAccessToken();
      const cleanSub = `${project.projectSlug}.sitezing.com.br`;
      await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${cleanSub}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
      
      if (project.officialDomain && project.officialDomain !== "Pendente") {
        await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${project.officialDomain}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
        await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/www.${project.officialDomain}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
      }
    } catch (e) {
      console.error("Erro ao remover domínios do hosting durante deleção de projeto:", e);
    }
    await ref.delete();
  }
  return { success: true };
});

// ==============================================================================
// GESTÃO DE DOMÍNIOS PERSONALIZADOS
// ==============================================================================
exports.addCustomDomain = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data; 
  
  if (!projectId || !domain) throw new HttpsError("invalid-argument", "Projeto e Domínio são obrigatórios.");

  try {
    const projectIdEnv = getProjectId();
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains?customDomainId=${cleanDomain}`;

    const response = await fetch(apiUrl, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({}) 
    });

    const domainData = await response.json();

    if (!response.ok) {
      if (domainData.error?.status === "ALREADY_EXISTS") throw new HttpsError("already-exists", "Este domínio já está em uso.");
      throw new HttpsError("unknown", `Erro Google: ${domainData.error?.message}`);
    }

    const wwwUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains?customDomainId=www.${cleanDomain}`;
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
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${cleanDomain}`, {
      method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
    });
    await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/www.${cleanDomain}`, {
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
    const token = await getFirebaseAccessToken();
    const cleanDomain = domain.trim().toLowerCase();

    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${cleanDomain}`;
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
// UTILITÁRIOS INTERNOS PARA STRIPE DINÂMICO
// ==============================================================================
async function getStripeConfig() {
  const db = admin.firestore();
  const snap = await db.collection("configs").doc("platform").get();
  if (!snap.exists) return null;
  return snap.data().stripe;
}

function getStripeInstance(stripeConfig) {
  if (!stripeConfig) throw new Error("Configuração do Stripe ausente no Banco de Dados.");
  const isProd = stripeConfig.mode === "prod";
  const key = isProd ? stripeConfig.prodSecretKey : stripeConfig.testSecretKey;
  if (!key) throw new Error(`Chave Secreta do Stripe (${isProd ? "PROD" : "TEST"}) não configurada.`);
  return new Stripe(key);
}

// ==============================================================================
// STRIPE CHECKOUT E MENSALIDADE
// ==============================================================================
exports.createStripeCheckoutSession = onCall({ cors: true }, async (request) => {
  ensureAuthed(request);
  const { projectId, origin, planType, priceId } = request.data || {};
  if (!projectId) throw new HttpsError("invalid-argument", "projectId é obrigatório.");

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

  const safeOrigin = origin && /^https?:\/\//.test(origin) ? origin : "https://sitezing.com.br";
  
  // Lógica de Preço: Se vier priceId (Dinâmico), usa ele. Senão usa o fallback (Hardcoded).
  let lineItem;
  if (priceId) {
    lineItem = { price: priceId, quantity: 1 };
  } else {
    const isAnual = planType === 'anual';
    const amount = isAnual ? 49900 : 4990;
    lineItem = {
      price_data: { 
        currency: "brl", 
        product_data: { 
          name: `SiteZing - Plano ${isAnual ? 'Anual' : 'Mensal'}`, 
          description: isAnual ? "Hospedagem e manutenção por 12 meses" : "Hospedagem e manutenção mensal" 
        }, 
        unit_amount: amount, 
        recurring: { interval: isAnual ? "year" : "month" } 
      },
      quantity: 1
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription", payment_method_types: ["card"],
    line_items: [lineItem],
    metadata: { planType: planType || 'dinamico' }, locale: "pt-BR", client_reference_id: projectId,
    allow_promotion_codes: true, // Habilita campo de cupom no Checkout
    success_url: `${safeOrigin}?payment=success&project=${projectId}`, cancel_url: `${safeOrigin}?payment=cancelled&project=${projectId}`
  });

  return { url: session.url };
});

exports.stripeWebhook = onRequest({ cors: true }, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const stripeConfig = await getStripeConfig();
  if (!stripeConfig) return res.status(500).send("Critial: No Stripe configuration found.");
  
  const isProd = stripeConfig.mode === "prod";
  const endpointSecret = isProd ? stripeConfig.prodWebhookSecret : stripeConfig.testWebhookSecret;
  if (!endpointSecret) return res.status(500).send(`Critical: Webhook Secret (${isProd ? "PROD" : "TEST"}) not configured.`);

  const stripe = getStripeInstance(stripeConfig);

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

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

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

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

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

// ============================================================================
// GOOGLE PLACES API: BUSCAR NEGÓCIO
// ============================================================================
exports.fetchGoogleBusiness = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const { query } = request.data;
  if (!query) throw new HttpsError("invalid-argument", "Busca vazia.");
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "SUA_API_KEY_AQUI"; 
  if (apiKey === "SUA_API_KEY_AQUI") throw new HttpsError("failed-precondition", "A API Key do Google Places ainda não foi configurada no Backend.");

  const axios = require("axios");
  
  try {
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    const data = {
      textQuery: query,
      languageCode: "pt-BR"
    };
    
    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.reviews,places.photos"
    };

    const searchRes = await axios.post(searchUrl, data, { headers });
    
    if (!searchRes.data.places || searchRes.data.places.length === 0) {
      throw new Error("Nenhum local encontrado com esse nome/link.");
    }
    const place = searchRes.data.places[0];

    const parsedReviews = (place.reviews || []).map(r => ({
      author_name: r.authorAttribution?.displayName || "Cliente",
      profile_photo_url: r.authorAttribution?.photoUri || "https://via.placeholder.com/50",
      rating: r.rating || 5,
      text: r.text?.text || "",
      relative_time_description: r.relativePublishTimeDescription || ""
    }));

    const parsedPhotos = (place.photos || []).slice(0, 12).map(p => {
       return `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=800&maxWidthPx=800&key=${apiKey}`;
    });

    return {
      name: place.displayName?.text || "",
      address: place.formattedAddress || "",
      phone: place.nationalPhoneNumber || "",
      website: place.websiteUri || "",
      rating: place.rating || 0,
      reviews: parsedReviews,
      photos: parsedPhotos
    };
  } catch (err) {
    console.error("Erro na API Places (New):", err.response?.data || err.message);
    throw new HttpsError("internal", "Falha ao consultar o Google: " + err.message);
  }
});

// ============================================================================
// FUNÇÕES DE ADMINISTRAÇÃO (cPanel)
// ============================================================================
const ADMIN_EMAIL = 'caiotleal@gmail.com';

exports.listAllProjectsAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }
  const db = admin.firestore();
  
  // 1. Buscar todos os usuários cadastrados
  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map(uDoc => ({
    uid: uDoc.id,
    ...uDoc.data(),
    email: uDoc.data().email || uDoc.data().ownerEmail || "Sem E-mail"
  }));

  // 2. Buscar todos os projetos
  const projectsSnap = await db.collectionGroup("projects").get();
  const userEmailsMap = {};
  allUsers.forEach(u => {
    userEmailsMap[u.uid] = u.email;
  });

  const projects = projectsSnap.docs.map(doc => {
    const data = doc.data();
    const { generatedHtml, ...rest } = data; // Remove HTML pesado para economia de banda
    return { 
      id: doc.id, 
      ...rest,
      accountEmail: userEmailsMap[data.uid] || data.ownerEmail || data.formData?.email || "Sem E-mail"
    };
  });

  return { projects, users: allUsers };
});

exports.deleteProjectAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }
  const { projectId } = request.data;
  const db = admin.firestore();
  
  const projectsSnap = await db.collectionGroup("projects").get();
  const projectDoc = projectsSnap.docs.find(d => d.id === projectId);
  if (!projectDoc) throw new HttpsError("not-found", "Projeto não encontrado.");
  
  await projectDoc.ref.delete();
  return { success: true };
});

exports.updateProjectAdminManual = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }
  const { projectId, manualCss, formData } = request.data;
  const db = admin.firestore();
  
  const projectsSnap = await db.collectionGroup("projects").get();
  const projectDoc = projectsSnap.docs.find(d => d.id === projectId);
  
  if (!projectDoc) throw new HttpsError("not-found", "Projeto não encontrado.");
  
  const docRef = projectDoc.ref;
  const currentData = projectDoc.data();
  
  // Mesclar formData se enviado, senão usa o atual
  const updatedFormData = formData ? { ...(currentData.formData || {}), ...formData, manualCss } : { ...(currentData.formData || {}), manualCss };

  await docRef.update({ 
    manualCss, 
    formData: updatedFormData
  });
  
  return { success: true };
});

/**
 * GESTÃO DE CONFIGURAÇÕES GLOBAIS (ADMIN)
 */
/**
 * CONFIGURAÇÕES PÚBLICAS (Acesso Geral)
 */
exports.getPlatformConfigsPublic = onCall({ cors: true }, async (request) => {
  const db = admin.firestore();
  try {
    const configDoc = await db.collection("configs").doc("platform").get();
    if (!configDoc.exists) {
      return {
        pricing: { mensal: 49.90, anual: 499.00 },
        marketing: { bannerActive: false, bannerText: "", bannerType: "info" }
      };
    }
    const data = configDoc.data();
    // NÃO RETORNA STRIPE KEYS OU LEGAL EM CONFIG PÚBLICA (Segurança)
    return {
      pricing: data.pricing || { mensal: 49.90, anual: 49.90 }, 
      marketing: data.marketing || { bannerActive: false, bannerText: "", bannerType: "info" },
      reviews: data.reviews || [],
      plans: data.plans || []
    };
  } catch (error) {
    return { pricing: { mensal: 49.90, anual: 499.00 }, marketing: { bannerActive: false } };
  }
});

exports.getPlatformConfigs = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }
  const db = admin.firestore();
  try {
    const configDoc = await db.collection("configs").doc("platform").get();
    if (!configDoc.exists) {
      return {
        stripe: { mode: "test", testPublicKey: "", testSecretKey: "", testWebhookSecret: "", prodPublicKey: "", prodSecretKey: "", prodWebhookSecret: "" },
        pricing: { mensal: 49.90, anual: 499.00 },
        marketing: { bannerActive: false, bannerText: "Promoção Especial!", bannerType: "info", couponCode: "" },
        legal: { termsOfUse: "", privacyPolicy: "" }
      };
    }
    return configDoc.data();
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

exports.updatePlatformConfigs = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }
  const { configs } = request.data;
  const db = admin.firestore();
  try {
    await db.collection("configs").doc("platform").set({
      ...configs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

/**
 * CRIAR CUPOM NO STRIPE (ADMIN)
 */
exports.createStripeCouponAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }

  const { code, percent_off, amount_off, duration = "once" } = request.data;
  if (!code) throw new HttpsError("invalid-argument", "O código do cupom é obrigatório.");

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

  try {
    // 1. Criar o Cupom (Lógica do Desconto)
    const coupon = await stripe.coupons.create({
      percent_off: percent_off ? parseFloat(percent_off) : undefined,
      amount_off: amount_off ? Math.round(parseFloat(amount_off) * 100) : undefined,
      currency: amount_off ? "brl" : undefined,
      duration: duration,
      name: `Cupom: ${code}`,
    });

    // 2. Criar o Código de Promoção vinculado (O que o cliente digita)
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.toUpperCase(),
    });

    // 3. Registrar no Firestore para exibição no cPanel
    const db = admin.firestore();
    await db.collection("configs").doc("platform").update({
      activeCoupons: admin.firestore.FieldValue.arrayUnion({
        id: coupon.id,
        promoId: promoCode.id,
        code: code.toUpperCase(),
        discount: percent_off ? `${percent_off}%` : `R$ ${amount_off}`,
        createdAt: new Date().toISOString()
      })
    });

    return { success: true, couponId: coupon.id, promoId: promoCode.id };
  } catch (error) {
    console.error("Erro ao criar cupom no Stripe:", error);
    throw new HttpsError("internal", `Erro no Stripe: ${error.message}`);
  }
});

exports.deleteStripeCouponAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }

  const { couponId, promoId, code } = request.data;
  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

  try {
    // Tenta desativar no Stripe
    if (promoId) await stripe.promotionCodes.update(promoId, { active: false });
    
    // Remove do Firestore
    const db = admin.firestore();
    const configDoc = await db.collection("configs").doc("platform").get();
    if (configDoc.exists) {
      const activeCoupons = configDoc.data().activeCoupons || [];
      const updatedCoupons = activeCoupons.filter(c => c.code !== code);
      await db.collection("configs").doc("platform").update({ activeCoupons: updatedCoupons });
    }

    return { success: true };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

/**
 * GESTÃO DE PLANOS DINÂMICOS (ADMIN)
 */
exports.createStripePlanAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }

  const { name, description, price, interval, features } = request.data;
  if (!name || !price) throw new HttpsError("invalid-argument", "Nome e preço são obrigatórios.");

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

  try {
    // 1. Criar Produto
    const product = await stripe.products.create({
      name: name,
      description: description || "Plano de hospedagem SiteZing",
    });

    // 2. Criar Preço (Recorrente)
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(parseFloat(price) * 100),
      currency: "brl",
      recurring: { interval: interval || "month" },
    });

    // 3. Registrar no Firestore
    const db = admin.firestore();
    await db.collection("configs").doc("platform").update({
      plans: admin.firestore.FieldValue.arrayUnion({
        id: product.id,
        priceId: stripePrice.id,
        name,
        description,
        price,
        interval: interval || "month",
        features: features || [],
        createdAt: new Date().toISOString()
      })
    });

    return { success: true, productId: product.id, priceId: stripePrice.id };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

exports.deleteStripePlanAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }

  const { productId, priceId } = request.data;
  const db = admin.firestore();

  try {
    // Apenas removemos do Firestore para não quebrar assinaturas ativas no Stripe
    const configDoc = await db.collection("configs").doc("platform").get();
    if (configDoc.exists) {
      const plans = configDoc.data().plans || [];
      const updatedPlans = plans.filter(p => p.id !== productId);
      await db.collection("configs").doc("platform").update({ plans: updatedPlans });
    }
    return { success: true };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});
