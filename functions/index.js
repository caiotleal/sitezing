const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
const nodemailer = require("nodemailer");
const Stripe = require("stripe");

if (!admin.apps.length) {
  const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  admin.initializeApp({
    storageBucket: firebaseConfig.storageBucket || "criador-de-site-1a91d.firebasestorage.app"
  });
  admin.firestore().settings({ ignoreUndefinedProperties: true });
}

const storage = admin.storage().bucket();

/**
 * Faz upload de uma string base64 para o Firebase Storage e retorna a URL pública.
 */
async function uploadBase64ToStorage(base64Data, folder = "generated_images") {
  if (!base64Data || !base64Data.startsWith("data:image")) return base64Data;

  // Limite de Segurança: Máximo 2MB por imagem para evitar abuso de Storage
  if (base64Data.length > 2 * 1024 * 1024 * 1.37) {
    console.warn("[Storage] Imagem base64 muito grande ignorada.");
    return null;
  }

  try {
    const mimeType = base64Data.match(/data:([^;]+);/)[1];
    const extension = mimeType.split("/")[1] || "jpg";
    const base64Content = base64Data.split(",")[1];
    const buffer = Buffer.from(base64Content, "base64");

    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const file = storage.file(fileName);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
      public: true
    });

    return `https://storage.googleapis.com/${storage.name}/${fileName}`;
  } catch (error) {
    console.error("Erro no upload para o Storage:", error);
    return base64Data;
  }
}

/**
 * Procura por imagens base64 no HTML, faz upload para o Storage e as substitui pelas URLs.
 */
async function cleanHtmlImages(html) {
  if (!html || typeof html !== "string") return html;

  const dataUriRegex = /src=["'](data:image\/[^;]+;base64,[^"']+)["']/g;
  let newHtml = html;
  const matches = [...html.matchAll(dataUriRegex)];

  if (matches.length === 0) return html;

  console.log(`[Clean] Encontradas ${matches.length} imagens base64 para limpar.`);

  for (const match of matches) {
    const base64 = match[1];
    const url = await uploadBase64ToStorage(base64);
    newHtml = newHtml.split(base64).join(url);
  }

  return newHtml;
}

/**
 * Remove valores 'undefined' recursivamente para evitar erros no Firestore.
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'function') return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined && typeof value !== 'function') {
        sanitized[key] = sanitizeObject(value);
      }
    }
  }
  return sanitized;
}

const geminiKey = defineSecret("GEMINI_KEY");
const googlePlacesKey = defineSecret("GOOGLE_PLACES_API_KEY");

const getProjectId = () => process.env.GCLOUD_PROJECT || JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;

const getGeminiClient = () => {
  const apiKey = geminiKey.value();
  if (!apiKey) throw new HttpsError("failed-precondition", "Secret GEMINI_KEY ausente.");
  return new GoogleGenerativeAI(apiKey);
};

const slugify = (value = "") => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

const isSafeInput = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[a-z0-9.-]+$/i.test(str) && !str.includes('..');
};

const ensureAuthed = (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Faça login para continuar.");
  return request.auth.uid;
};

const toTimestampMs = (value) => {
  if (!value) return null;
  if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value.toDate === "function") {
    const parsed = value.toDate().getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value._seconds === "number") return value._seconds * 1000;
  return null;
};

async function getFirebaseAccessToken() {
  try {
    const auth = new GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/firebase",
        "https://www.googleapis.com/auth/cloud-platform"
      ]
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token || tokenResponse;
  } catch (err) {
    console.error("🚨 [AUTH/ADC] Erro Crítico ao obter token via GoogleAuth:", err.message);
    throw new HttpsError("unauthenticated", "Falha interna de autorização (Firebase Hosting Token Error).");
  }
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

  if (cleanHost.endsWith('.sitezing.com.br')) {
    const slug = cleanHost.replace('.sitezing.com.br', '');
    projectSnap = await db.collectionGroup("projects").where("projectSlug", "==", slug).limit(1).get();
    if (projectSnap.empty) {
      projectSnap = await db.collectionGroup("projects").where("internalDomain", "==", slug).limit(1).get();
    }
  } else {
    projectSnap = await db.collectionGroup("projects").where("officialDomain", "==", cleanHost).limit(1).get();
  }

  if (!projectSnap || projectSnap.empty) {
    throw new HttpsError("not-found", "O site não foi encontrado no banco de dados.");
  }

  const project = projectSnap.docs[0].data();

  if (project.status === "frozen") {
    throw new HttpsError("permission-denied", "Este site encontra-se temporariamente suspenso.");
  }

  const expiresAtMs = toTimestampMs(project.expiresAt);
  const isPaidProject = project.paymentStatus === "paid";
  if (!isPaidProject && expiresAtMs && expiresAtMs <= Date.now()) {
    const projectRef = projectSnap.docs[0].ref;
    await projectRef.update({
      status: "frozen",
      paymentStatus: "expired",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    throw new HttpsError("permission-denied", "Este link expirou. Renove o plano para reativar o site.");
  }

  let html = project.generatedHtml || "";

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
async function callImagen(prompt, apiKey) {
  try {
    const refinedPrompt = `A high-end, realistic commercial photograph of: ${prompt}. Shot on a 35mm lens, natural lighting, authentic detailed textures, 8k resolution. Pure photography.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [{ prompt: refinedPrompt }], parameters: { sampleCount: 1, aspectRatio: "1:1" } })
    });
    const data = await response.json();
    if (data.predictions?.[0]) {
      const base64 = `data:${data.predictions[0].mimeType || "image/jpeg"};base64,${data.predictions[0].bytesBase64Encoded}`;
      return await uploadBase64ToStorage(base64);
    }
    return null;
  } catch (e) {
    console.error("Erro Imagen:", e);
    return null;
  }
}

exports.generateSite = onCall({ cors: true, timeoutSeconds: 120, memory: "512MiB", secrets: [geminiKey] }, async (request) => {
  const uid = ensureAuthed(request);
  const genAI = getGeminiClient();
  const { businessName, description, region, googleContext } = request.data;
  if (!businessName) throw new HttpsError("invalid-argument", "Nome obrigatório");

  // Correção Aplicada: Alterado para gemini-2.5-flash-lite conforme solicitado
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite", generationConfig: { responseMimeType: "application/json" } });

  let prompt = `Atue como um redator publicitário sênior. Empresa: "${businessName}". Descrição: "${description}". Região de atuação: "${region || "Brasil"}". 
  
  ⚠️ REGRAS DE SEGURANÇA CRÍTICAS:
  - PROIBIDO gerar conteúdo adulto, erótico ou pornográfico.
  - PROIBIDO conteúdo sobre drogas ilícitas, armas de fogo ou violência.
  - PROIBIDO qualquer apologia a crimes ou atividades ilegais.
  Se o pedido violar estas regras, gere um JSON com heroTitle: "Conteúdo Bloqueado" e heroSubtitle: "O tema solicitado viola nossas políticas de segurança.".

  Gere JSON exato com as chaves: heroTitle, heroSubtitle, aboutTitle, aboutText, contactCall, heroImagePrompt, aboutImagePrompt. Textos curtos, persuasivos e com linguagem natural. 
  As chaves heroImagePrompt e aboutImagePrompt devem conter descrições visuais DETALHADAS e em INGLÊS para um gerador de imagens IA (Imagen 4). 
  - heroImagePrompt: Deve ser uma imagem de impacto, épica, que represente o SERVIÇO ou PRODUTO principal da empresa em um cenário profissional e iluminado. 
  - aboutImagePrompt: Deve ser uma imagem que represente a essência do negócio, como o ambiente de trabalho, ferramentas ou uma pessoa representando a categoria profissional feliz e focada.
  FOQUE ABSOLUTAMENTE NA CATEGORIA DO NEGÓCIO (${businessName}).`;

  if (googleContext) {
    prompt += ` Integre naturalmente também as seguintes informações reais do perfil e avaliações do Google Maps desta empresa para criar uma comunicação verdadeira e social proof: ${googleContext}`;
  }

  try {
    const result = await model.generateContent(prompt);
    const aiData = JSON.parse(result.response.text().replace(/```json/g, "").replace(/```/g, "").replace(/\\n/g, "").trim());

    // Geração de Imagens garantindo o uso correto do Secret
    const apiKey = geminiKey.value();
    const [heroImage, aboutImage] = await Promise.all([
      callImagen(aiData.heroImagePrompt || businessName, apiKey),
      callImagen(aiData.aboutImagePrompt || businessName, apiKey)
    ]);

    return { ...aiData, heroImage, aboutImage };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

exports.generateImage = onCall({ cors: true, timeoutSeconds: 120, secrets: [geminiKey] }, async (request) => {
  const uid = ensureAuthed(request);
  const { prompt } = request.data;
  if (!prompt) throw new HttpsError("invalid-argument", "O descritivo da imagem é obrigatório.");

  try {
    const apiKey = geminiKey.value();
    const refinedPrompt = `A high-end, realistic commercial photograph of: ${prompt}. Shot on a 35mm lens, natural lighting, authentic detailed textures, 8k resolution. Pure photography.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [{ prompt: refinedPrompt }], parameters: { sampleCount: 1, aspectRatio: "1:1" } })
    });
    const data = await response.json();
    const base64 = `data:${data.predictions[0].mimeType || "image/jpeg"};base64,${data.predictions[0].bytesBase64Encoded}`;
    const imageUrl = await uploadBase64ToStorage(base64);
    return { imageUrl };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

exports.saveSiteProject = onCall({ cors: true, memory: "512MiB" }, async (request) => {
  const uid = ensureAuthed(request);
  const { businessName, officialDomain, internalDomain, generatedHtml, formData, aiContent } = request.data;

  let projectSlug = internalDomain || slugify(businessName).slice(0, 30);

  const snap = await admin.firestore().collectionGroup("projects").where("projectSlug", "==", projectSlug).limit(1).get();
  if (!snap.empty) {
    const existingOwnerId = snap.docs[0].ref.parent.parent.id;
    if (existingOwnerId !== uid) {
      const shortHash = Math.random().toString(36).substring(2, 6);
      projectSlug = `${projectSlug}-${shortHash}`;
    }
  }

  await admin.firestore().collection("users").doc(uid).set({ activeUser: true, uid: uid }, { merge: true });

  const cleanedHtml = await cleanHtmlImages(generatedHtml);
  const safeAiContent = sanitizeObject(aiContent);
  const safeFormData = sanitizeObject(formData);

  const now = admin.firestore.FieldValue.serverTimestamp();
  await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectSlug).set({
    uid, businessName, projectSlug, internalDomain: projectSlug,
    officialDomain: officialDomain || "Pendente", generatedHtml: cleanedHtml, formData: safeFormData, aiContent: safeAiContent,
    updatedAt: now, createdAt: now, status: "draft", paymentStatus: "pending"
  }, { merge: true });

  return { success: true, projectSlug };
});

exports.updateUserProfile = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const { fullName, document, phone, address, birthDate } = request.data;

  if (!fullName || !document || !phone || !address) {
    throw new HttpsError("invalid-argument", "Dados de identidade incompletos.");
  }

  await admin.firestore().collection("users").doc(uid).set({
    fullName, document, phone, address, birthDate,
    kycCompleted: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true };
});

exports.getUserProfile = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const snap = await admin.firestore().collection("users").doc(uid).get();
  return snap.exists ? snap.data() : null;
});

exports.checkDomainAvailability = onCall({ cors: true }, async (request) => {
  try {
    const { projectSlug } = request.data || {};

    if (!projectSlug) {
      return { available: false, error: "Slug não informado." };
    }

    const cleanSlug = slugify(projectSlug).slice(0, 30);
    const db = admin.firestore();
    const snap = await db.collectionGroup("projects").where("projectSlug", "==", cleanSlug).limit(1).get();

    return { available: snap.empty, checkedSlug: cleanSlug };
  } catch (error) {
    console.error("Erro no checkDomainAvailability:", error);
    return { available: false, error: error.message };
  }
});

exports.updateSiteProject = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const targetId = request.data.targetId || request.data.projectId || request.data.projectSlug;
  const { html, formData, aiContent } = request.data;

  const cleanedHtml = await cleanHtmlImages(html);
  const safeAiContent = sanitizeObject(aiContent);
  const safeFormData = sanitizeObject(formData);

  await admin.firestore().collection("users").doc(uid).collection("projects").doc(targetId).update({
    generatedHtml: cleanedHtml, ...(formData && { formData: safeFormData }), ...(aiContent && { aiContent: safeAiContent }),
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

exports.publishUserProject = onCall({ cors: true, secrets: [geminiKey] }, async (request) => {
  try {
    const uid = ensureAuthed(request);
    const targetId = request.data.targetId || request.data.projectId || request.data.projectSlug;

    const db = admin.firestore();
    const ref = db.collection("users").doc(uid).collection("projects").doc(targetId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Projeto não encontrado.");
    const project = snap.data();

    if (project.status === "frozen") throw new HttpsError("permission-denied", "Site congelado. Renove o plano.");

    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data() || {};
    const requiredFields = ["fullName", "document", "phone", "address"];
    const missingFields = requiredFields.filter(f => !userData[f]);

    if (missingFields.length > 0) {
      throw new HttpsError("failed-precondition", `Perfil incompleto. Campos obrigatórios: ${missingFields.join(", ")}`);
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const modPrompt = `Analise o seguinte conteúdo de site e responda 'SAFE' ou 'UNSAFE'. 
    Marque como 'UNSAFE' se contiver: pornografia, violência explícita, apologia a crimes, drogas ilícitas ou golpes. 
    Conteúdo: ${project.generatedHtml.substring(0, 5000)}`;

    const modResult = await model.generateContent(modPrompt);
    const modText = modResult.response.text().trim().toUpperCase();

    if (modText.includes("UNSAFE")) {
      await ref.update({ status: "blocked", moderatorNote: "Conteúdo violou políticas de segurança." });
      throw new HttpsError("permission-denied", "Seu site foi bloqueado por violar nossas políticas de conteúdo seguro.");
    }

    const subdomainVal = `${project.projectSlug}.sitezing.com.br`;
    const publicUrl = `https://${subdomainVal}`;

    if (!project.published) {
      try {
        if (!isSafeInput(subdomainVal)) throw new Error("Subdomínio inválido detected.");

        const projectIdEnv = getProjectId();
        const token = await getFirebaseAccessToken();
        const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains?customDomainId=${subdomainVal}`;

        console.log(`[Publish] Registrando subdomínio ${subdomainVal} no Hosting...`);

        const response = await fetch(apiUrl, {
          method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[Publish] Aviso ao registrar subdomínio: ${response.status}`, errorText);
        }
      } catch (apiError) {
        console.error("Erro ao registrar subdomínio no Hosting da nuvem Firebase:", apiError.message);
      }
    }

    const isPaidProject = project.paymentStatus === "paid";
    let nextExpiresAt = project.expiresAt || null;

    if (!isPaidProject && !nextExpiresAt) {
      const trialExpiration = new Date();
      trialExpiration.setDate(trialExpiration.getDate() + 7);
      nextExpiresAt = admin.firestore.Timestamp.fromDate(trialExpiration);
    }

    if (!isPaidProject && nextExpiresAt) {
      const nextExpiresAtMs = toTimestampMs(nextExpiresAt);
      if (!nextExpiresAtMs) {
        throw new HttpsError("failed-precondition", "Data de expiração inválida no projeto.");
      }
      nextExpiresAt = admin.firestore.Timestamp.fromMillis(nextExpiresAtMs);
      if (nextExpiresAtMs < Date.now()) {
        throw new HttpsError("permission-denied", "Seu período de teste expirou.");
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
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message);
  }
});

exports.deleteUserProject = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const targetId = request.data.targetId || request.data.projectId || request.data.projectSlug;
  const ref = admin.firestore().collection("users").doc(uid).collection("projects").doc(targetId);
  const snap = await ref.get();

  if (snap.exists) {
    const project = snap.data();
    try {
      const projectIdEnv = getProjectId();
      const token = await getFirebaseAccessToken();
      const cleanSub = `${project.projectSlug}.sitezing.com.br`;
      await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${cleanSub}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });

      if (project.officialDomain && project.officialDomain !== "Pendente") {
        await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${project.officialDomain}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/www.${project.officialDomain}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
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
    if (!projectIdEnv || projectIdEnv === '{}') {
      throw new HttpsError("failed-precondition", "Configuração de ID do projeto ausente no ambiente Cloud.");
    }

    const token = await getFirebaseAccessToken();
    const cleanDomain = (domain || "").trim().toLowerCase();
    if (!isSafeInput(cleanDomain)) throw new HttpsError("invalid-argument", "Domínio em formato inválido detectado.");

    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains?customDomainId=${cleanDomain}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    let domainData = {};
    const responseText = await response.text();
    try {
      if (responseText) domainData = JSON.parse(responseText);
    } catch (e) { }

    if (!response.ok) {
      if (domainData.error?.status === "ALREADY_EXISTS") {
        throw new HttpsError("already-exists", "Este domínio já está em uso em outro projeto Firebase.");
      }
      throw new HttpsError("unknown", `Erro Google: ${domainData.error?.message || "Erro desconhecido na API de Hosting"}`);
    }

    const wwwUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains?customDomainId=www.${cleanDomain}`;
    await fetch(wwwUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ redirectTarget: cleanDomain })
    });

    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      officialDomain: cleanDomain,
      domainStatus: domainData.hostState || domainData.status || "PENDING",
      domainRecords: domainData.requiredDnsUpdates || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      status: domainData.hostState || "PENDING",
      records: domainData.requiredDnsUpdates
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(error.code || "internal", error.message);
  }
});

exports.removeCustomDomain = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data;
  if (!projectId || !domain) throw new HttpsError("invalid-argument", "Dados obrigatórios.");

  try {
    const projectIdEnv = getProjectId();
    const token = await getFirebaseAccessToken();
    const cleanDomain = (domain || "").trim().toLowerCase();

    if (!isSafeInput(cleanDomain)) throw new HttpsError("invalid-argument", "Domínio em formato inválido detectado.");

    await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${cleanDomain}`, {
      method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
    });

    await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/www.${cleanDomain}`, {
      method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
    });

    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      officialDomain: "Pendente",
      domainStatus: "PENDING",
      domainRecords: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    throw new HttpsError(error.code || "internal", error.message);
  }
});

exports.verifyDomainPropagation = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  const uid = ensureAuthed(request);
  const { projectId, domain } = request.data;
  if (!projectId || !domain) throw new HttpsError("invalid-argument", "Dados obrigatórios.");

  try {
    const projectIdEnv = getProjectId();
    const token = await getFirebaseAccessToken();
    const cleanDomain = (domain || "").trim().toLowerCase();

    if (!isSafeInput(cleanDomain)) throw new HttpsError("invalid-argument", "Domínio em formato inválido detectado.");

    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${cleanDomain}`;
    const response = await fetch(apiUrl, { method: "GET", headers: { "Authorization": `Bearer ${token}` } });

    const responseText = await response.text();
    let domainData = {};
    try {
      if (responseText) domainData = JSON.parse(responseText);
    } catch (e) { }

    if (!response.ok) {
      throw new HttpsError("unknown", `Erro Google: ${domainData.error?.message || "Não foi possível consultar o status do domínio"}`);
    }

    const isPropagated = domainData.hostState === "HOSTING_ACTIVE" || domainData.status === "ACTIVE";

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
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(error.code || "internal", error.message);
  }
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

async function findProjectDocById(projectId, ownerUid = null) {
  if (!projectId) return null;
  const db = admin.firestore();
  
  // 1. Tentar busca DIRETA se tivermos o Owner UID (Mais seguro e performático)
  if (ownerUid) {
    console.log(`[ProjectLookup] Tentando busca DIRETA: users/${ownerUid}/projects/${projectId}`);
    const directDoc = await db.collection("users").doc(ownerUid).collection("projects").doc(projectId).get();
    if (directDoc.exists) {
      console.log(`[ProjectLookup] Sucesso na busca DIRETA.`);
      return directDoc;
    }
    console.warn(`[ProjectLookup] Busca DIRETA falhou, tentando Fallbacks...`);
  }

  console.log(`[ProjectLookup] Iniciando busca via CollectionGroup para: ${projectId}`);

  // 2. Tentar busca por Document ID
  const idSnap = await db.collectionGroup("projects")
    .where(admin.firestore.FieldPath.documentId(), "==", projectId)
    .limit(1)
    .get();
  if (!idSnap.empty) return idSnap.docs[0];

  // 3. Tentar busca por projectSlug
  const slugSnap = await db.collectionGroup("projects")
    .where("projectSlug", "==", projectId)
    .limit(1)
    .get();
  if (!slugSnap.empty) return slugSnap.docs[0];

  // 4. Tentar busca por internalDomain (Crucial para visualização pública)
  const internalSnap = await db.collectionGroup("projects")
    .where("internalDomain", "==", projectId)
    .limit(1)
    .get();
  if (!internalSnap.empty) return internalSnap.docs[0];

  // 5. Tentar busca por customSlug
  const customSnap = await db.collectionGroup("projects")
    .where("customSlug", "==", projectId)
    .limit(1)
    .get();
  if (!customSnap.empty) return customSnap.docs[0];

  // 6. Tentar busca por officialDomain
  const domainSnap = await db.collectionGroup("projects")
    .where("officialDomain", "==", projectId)
    .limit(1)
    .get();
  if (!domainSnap.empty) return domainSnap.docs[0];

  console.warn(`[ProjectLookup] Nenhum projeto encontrado para o identificador: ${projectId}`);
  return null;
}

async function applyStripeSubscriptionToProject(projectRef, { subscription, session, planType }) {
  const subscriptionStatus = subscription?.status || "active";
  const stripePeriodEnd = subscription?.current_period_end || null;
  const expiresAt = stripePeriodEnd ?
    admin.firestore.Timestamp.fromMillis(stripePeriodEnd * 1000) :
    null;

  console.log("[StripeSync] subscription payload:", JSON.stringify({
    id: subscription?.id || null,
    status: subscriptionStatus,
    current_period_end: stripePeriodEnd,
    cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
    customer: subscription?.customer || session?.customer || null,
    projectId: session?.client_reference_id || null,
  }));

  const isPaidLike = ["active", "trialing", "past_due", "unpaid"].includes(subscriptionStatus);
  const updatePayload = {
    status: "published",
    paymentStatus: isPaidLike ? "paid" : "pending",
    planSelected: planType || "mensal",
    stripeSubscriptionId: subscription?.id || session?.subscription || null,
    stripeCustomerId: subscription?.customer || session?.customer || null,
    subscriptionStatus,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (expiresAt) updatePayload.expiresAt = expiresAt;
  await projectRef.update(updatePayload);
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

  const ownerUid = request.auth.uid;

  const sessionParams = {
    mode: 'subscription',
    line_items: [lineItem],
    success_url: `${safeOrigin}?payment=success&tab=status&project=${projectId}`,
    cancel_url: `${safeOrigin}?payment=cancelled&project=${projectId}`,
    metadata: { projectId, planType, ownerUid },
    subscription_data: { metadata: { projectId, planType, ownerUid } },
    client_reference_id: projectId,
    allow_promotion_codes: true,
    payment_method_collection: 'always',
  };

  const db = admin.firestore();
  const configDoc = await db.collection("configs").doc("platform").get();
  if (configDoc.exists) {
    const plans = configDoc.data().plans || [];
    const targetPlan = plans.find(p => p.priceId === priceId || (p.id === priceId));

    if (targetPlan?.interval === 'one_time' || targetPlan?.allowInstallments) {
      sessionParams.mode = 'payment';
      delete sessionParams.payment_method_collection;

      sessionParams.payment_method_types = ['card'];
      sessionParams.billing_address_collection = 'required';
    }

    if (targetPlan?.allowInstallments) {
      sessionParams.mode = 'payment';

      try {
        const priceObj = await stripe.prices.retrieve(priceId);
        sessionParams.line_items = [{
          price_data: {
            currency: priceObj.currency,
            product: priceObj.product,
            unit_amount: priceObj.unit_amount,
          },
          quantity: 1
        }];
      } catch (e) { }

      const installmentsConfig = { enabled: true };
      if (targetPlan.interestFree) {
        installmentsConfig.plan = {
          type: 'merchant_paid',
          count: parseInt(targetPlan.maxInstallments) || 12
        };
      }

      sessionParams.payment_method_options = {
        card: { installments: installmentsConfig }
      };
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { url: session.url };
});

exports.stripeWebhook = onRequest({ cors: true }, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const stripeConfig = await getStripeConfig();
  if (!stripeConfig) return res.status(500).send("Critial: No Stripe configuration found.");

  const isProd = stripeConfig.mode === "prod";
  const endpointSecret = isProd ? stripeConfig.prodWebhookSecret : stripeConfig.testWebhookSecret;
  if (!endpointSecret) return res.status(500).send(`Critical: Webhook Secret not configured.`);

  const stripe = getStripeInstance(stripeConfig);

  let event;
  try { event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret); }
  catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  console.log("[StripeWebhook] Evento recebido:", event.type, "id:", event.id);

  // LOG DE DEPURAÇÃO (Ferramenta solicitada pelo usuário)
  try {
    const db = admin.firestore();
    await db.collection("_webhook_logs").add({
      type: event.type,
      eventId: event.id,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      payload: event.data.object,
      fullEvent: JSON.parse(JSON.stringify(event)) // Garante serialização limpa
    });
  } catch (e) {
    console.error("[StripeWebhook] Falha ao gravar log no Firestore:", e.message);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const projectId = session.client_reference_id;
    const planType = session.metadata?.planType || 'anual';
    console.log("[StripeWebhook] checkout.session.completed payload:", JSON.stringify({
      id: session.id,
      mode: session.mode,
      client_reference_id: session.client_reference_id,
      subscription: session.subscription,
      customer: session.customer,
      metadata: session.metadata || {},
    }));

    if (projectId) {
      try {
        const ownerUid = session.metadata?.ownerUid || null;
        const projectDoc = await findProjectDocById(projectId, ownerUid);
        if (!projectDoc) {
          console.warn(`[StripeWebhook] Projeto não encontrado para projectId=${projectId}`);
        } else if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await applyStripeSubscriptionToProject(projectDoc.ref, { subscription, session, planType });
        } else {
          const fallbackExpiration = new Date();
          planType === "anual" ?
            fallbackExpiration.setFullYear(fallbackExpiration.getFullYear() + 1) :
            fallbackExpiration.setMonth(fallbackExpiration.getMonth() + 1);
          await projectDoc.ref.update({
            status: "published",
            paymentStatus: "paid",
            planSelected: planType,
            stripeCustomerId: session.customer || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(fallbackExpiration),
          });
        }
      } catch (error) { console.error(`❌ Erro no banco:`, error); }
    }
  } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object;
    const projectId = subscription?.metadata?.projectId || null;
    console.log(`[StripeWebhook] ${event.type} payload:`, JSON.stringify({
      id: subscription?.id,
      status: subscription?.status,
      current_period_end: subscription?.current_period_end,
      customer: subscription?.customer,
      projectId,
    }));
    if (projectId) {
      const ownerUid = subscription?.metadata?.ownerUid || null;
      const projectDoc = await findProjectDocById(projectId, ownerUid);
      if (projectDoc) {
        await applyStripeSubscriptionToProject(projectDoc.ref, {
          subscription,
          session: null,
          planType: subscription?.metadata?.planType,
        });
      }
    }
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const projectId = subscription?.metadata?.projectId || null;
    console.log("[StripeWebhook] customer.subscription.deleted payload:", JSON.stringify({
      id: subscription?.id,
      status: subscription?.status,
      current_period_end: subscription?.current_period_end,
      projectId,
    }));
    if (projectId) {
      const ownerUid = subscription?.metadata?.ownerUid || null;
      const projectDoc = await findProjectDocById(projectId, ownerUid);
      if (projectDoc) {
        await projectDoc.ref.update({
          subscriptionStatus: "canceled",
          paymentStatus: "expired",
          cancelAtPeriodEnd: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  } else if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    console.log("[StripeWebhook] invoice.paid payload:", JSON.stringify({
      id: invoice.id,
      subscription: subscriptionId,
      customer: invoice.customer,
      amount: invoice.amount_paid,
    }));

    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const projectId = subscription.metadata?.projectId || invoice.metadata?.projectId;
        const ownerUid = subscription.metadata?.ownerUid || invoice.metadata?.ownerUid || null;
        if (projectId) {
          const projectDoc = await findProjectDocById(projectId, ownerUid);
          if (projectDoc) {
            await applyStripeSubscriptionToProject(projectDoc.ref, {
              subscription,
              session: null,
              planType: subscription.metadata?.planType || "mensal",
            });
          }
        }
      } catch (err) {
        console.error("[StripeWebhook] Erro ao processar invoice.paid:", err);
      }
    }
  } else if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const projectId = subscription.metadata?.projectId;
        if (projectId) {
          const projectDoc = await findProjectDocById(projectId);
          if (projectDoc) {
            await projectDoc.ref.update({
              paymentStatus: "past_due",
              subscriptionStatus: "past_due",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      } catch (err) { }
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
  const { projectId } = request.data || {};
  if (!projectId) throw new HttpsError("invalid-argument", "Código do projeto ausente.");

  try {
    const projectRef = admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId);
    const snap = await projectRef.get();

    if (!snap.exists) throw new HttpsError("not-found", "Projeto não encontrado em sua conta.");
    const project = snap.data();

    if (!project?.stripeSubscriptionId) {
      throw new HttpsError("failed-precondition", "Este site não possui uma assinatura vinculada para reativar.");
    }

    const stripeConfig = await getStripeConfig();
    const stripe = getStripeInstance(stripeConfig);

    try {
      const subscription = await stripe.subscriptions.retrieve(project.stripeSubscriptionId);
      if (subscription.status === 'canceled') {
        throw new HttpsError("failed-precondition", "A assinatura anterior já foi totalmente cancelada.");
      }

      await stripe.subscriptions.update(project.stripeSubscriptionId, { cancel_at_period_end: false });
      await projectRef.update({
        cancelAtPeriodEnd: false,
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, message: "Assinatura reativada com sucesso!" };
    } catch (stripeError) {
      throw new HttpsError("internal", "Erro no Stripe: " + (stripeError.message || "Erro desconhecido"));
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Erro crítico no servidor.");
  }
});

exports.cleanupExpiredSites = onSchedule("every 24 hours", async (event) => {
  const db = admin.firestore();
  const nowMs = Date.now();
  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const projectsSnap = await db.collection("users").doc(userDoc.id).collection("projects").get();
    for (const doc of projectsSnap.docs) {
      const data = doc.data();
      const expiresAtMs = toTimestampMs(data.expiresAt);
      const isPaid = data.paymentStatus === "paid";
      if (!isPaid && expiresAtMs && expiresAtMs <= nowMs && data.status !== "frozen") {
        await doc.ref.update({ status: "frozen", paymentStatus: "expired" });
      }
    }
  }
});

// ============================================================================
// GOOGLE PLACES API: BUSCAR NEGÓCIO
// ============================================================================
exports.fetchGoogleBusiness = onCall({ cors: true, secrets: [googlePlacesKey] }, async (request) => {
  const uid = ensureAuthed(request);
  const { query } = request.data;
  if (!query) throw new HttpsError("invalid-argument", "Busca vazia.");

  const apiKey = googlePlacesKey.value();
  if (!apiKey || apiKey === "SUA_API_KEY_AQUI") throw new HttpsError("failed-precondition", "A API Key do Google Places ainda não foi configurada.");

  const axios = require("axios");

  try {
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    const data = {
      textQuery: query,
      languageCode: "pt-BR"
    };

    // Correção Aplicada: Headers do FieldMask limpos
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
    if (err.response) {
      const status = err.response.status;
      if (status === 403) throw new HttpsError("permission-denied", "Acesso Negado (403): O Google bloqueou a consulta por falta de cota ou API desativada.");
      if (status === 402) throw new HttpsError("resource-exhausted", "Erro de Faturamento (402): Cota excedida.");
      if (status === 404) throw new HttpsError("not-found", "Endpoint Google Places não encontrado.");
      throw new HttpsError("internal", `Erro da API Google Places (${status}).`);
    } else {
      throw new HttpsError("internal", "Falha interna severa: " + err.message);
    }
  }
});

// ============================================================================
// FUNÇÕES DE ADMINISTRAÇÃO (cPanel)
// ============================================================================
const ADMIN_EMAIL = 'caiotleal@gmail.com';

exports.listAllProjectsAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");

  const db = admin.firestore();
  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map(uDoc => ({ uid: uDoc.id, ...uDoc.data(), email: uDoc.data().email || uDoc.data().ownerEmail || "Sem E-mail" }));

  const projectsSnap = await db.collectionGroup("projects").get();
  const userEmailsMap = {};
  allUsers.forEach(u => { userEmailsMap[u.uid] = u.email; });

  const projects = projectsSnap.docs.map(doc => {
    const data = doc.data();
    const { generatedHtml, ...rest } = data;
    return { id: doc.id, ...rest, accountEmail: userEmailsMap[data.uid] || data.ownerEmail || data.formData?.email || "Sem E-mail" };
  });

  return { projects, users: allUsers };
});

exports.deleteProjectAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { projectId } = request.data;
  const db = admin.firestore();
  const projectsSnap = await db.collectionGroup("projects").get();
  const projectDoc = projectsSnap.docs.find(d => d.id === projectId);
  if (!projectDoc) throw new HttpsError("not-found", "Projeto não encontrado.");
  await projectDoc.ref.delete();
  return { success: true };
});

exports.updateProjectAdminManual = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { projectId, manualCss, formData } = request.data;
  const db = admin.firestore();

  const projectsSnap = await db.collectionGroup("projects").get();
  const projectDoc = projectsSnap.docs.find(d => d.id === projectId);
  if (!projectDoc) throw new HttpsError("not-found", "Projeto não encontrado.");

  const currentData = projectDoc.data();
  const updatedFormData = formData ? { ...(currentData.formData || {}), ...formData, manualCss } : { ...(currentData.formData || {}), manualCss };

  await projectDoc.ref.update({ manualCss, formData: updatedFormData });
  return { success: true };
});

exports.getPlatformConfigsPublic = onCall({ cors: true }, async (request) => {
  const db = admin.firestore();
  try {
    const configDoc = await db.collection("configs").doc("platform").get();
    if (!configDoc.exists) return { pricing: { mensal: 49.90, anual: 499.00 }, marketing: { bannerActive: false, bannerText: "", bannerType: "info" } };
    const data = configDoc.data();
    return {
      pricing: data.pricing || { mensal: 49.90, anual: 49.90 },
      marketing: data.marketing || { bannerActive: false, bannerText: "", bannerType: "info" },
      reviews: data.reviews || [],
      plans: data.plans || []
    };
  } catch (error) { return { pricing: { mensal: 49.90, anual: 499.00 }, marketing: { bannerActive: false } }; }
});

exports.getPlatformConfigs = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const db = admin.firestore();
  try {
    const configDoc = await db.collection("configs").doc("platform").get();
    if (!configDoc.exists) return { stripe: {}, pricing: {}, marketing: {}, legal: {} };
    return configDoc.data();
  } catch (error) { throw new HttpsError("internal", error.message); }
});

exports.updatePlatformConfigs = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { configs } = request.data;
  const db = admin.firestore();
  try {
    await db.collection("configs").doc("platform").set({ ...configs, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (error) { throw new HttpsError("internal", error.message); }
});

exports.createStripeCouponAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { code, percent_off, amount_off, duration = "once" } = request.data;
  if (!code) throw new HttpsError("invalid-argument", "O código do cupom é obrigatório.");

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

  try {
    const coupon = await stripe.coupons.create({
      percent_off: percent_off ? parseFloat(percent_off) : undefined,
      amount_off: amount_off ? Math.round(parseFloat(amount_off) * 100) : undefined,
      currency: amount_off ? "brl" : undefined,
      duration: duration,
      name: `Cupom: ${code}`,
    });

    const promoCode = await stripe.promotionCodes.create({ coupon: coupon.id, code: code.toUpperCase() });

    const db = admin.firestore();
    await db.collection("configs").doc("platform").update({
      activeCoupons: admin.firestore.FieldValue.arrayUnion({
        id: coupon.id, promoId: promoCode.id, code: code.toUpperCase(),
        discount: percent_off ? `${percent_off}%` : `R$ ${amount_off}`, createdAt: new Date().toISOString()
      })
    });

    return { success: true, couponId: coupon.id, promoId: promoCode.id };
  } catch (error) { throw new HttpsError("internal", `Erro no Stripe: ${error.message}`); }
});

exports.deleteStripeCouponAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { couponId, promoId, code } = request.data;
  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

  try {
    if (promoId) await stripe.promotionCodes.update(promoId, { active: false });
    const db = admin.firestore();
    const configDoc = await db.collection("configs").doc("platform").get();
    if (configDoc.exists) {
      const activeCoupons = configDoc.data().activeCoupons || [];
      const updatedCoupons = activeCoupons.filter(c => c.code !== code);
      await db.collection("configs").doc("platform").update({ activeCoupons: updatedCoupons });
    }
    return { success: true };
  } catch (error) { throw new HttpsError("internal", error.message); }
});

exports.createStripePlanAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { name, description, price, interval, features, badge, sortOrder, allowInstallments, maxInstallments, interestFree } = request.data;
  if (!name || !price) throw new HttpsError("invalid-argument", "Nome e preço são obrigatórios.");

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);

  try {
    const product = await stripe.products.create({ name: name, description: description || "Plano de hospedagem SiteZing" });
    const priceData = { product: product.id, unit_amount: Math.round(parseFloat(price) * 100), currency: "brl" };

    if (interval === 'bimestral') priceData.recurring = { interval: 'month', interval_count: 2 };
    else if (interval === 'trimestral') priceData.recurring = { interval: 'month', interval_count: 3 };
    else if (interval === 'semestral') priceData.recurring = { interval: 'month', interval_count: 6 };
    else if (interval !== 'one_time') priceData.recurring = { interval: interval || "month" };

    const stripePrice = await stripe.prices.create(priceData);

    const db = admin.firestore();
    await db.collection("configs").doc("platform").update({
      plans: admin.firestore.FieldValue.arrayUnion({
        id: product.id, priceId: stripePrice.id, name, description, price, interval: interval || "month",
        features: features || [], badge: badge || "", sortOrder: parseInt(sortOrder) || 0,
        allowInstallments: !!allowInstallments, maxInstallments: parseInt(maxInstallments) || 12, interestFree: !!interestFree,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      })
    });

    return { success: true, productId: product.id, priceId: stripePrice.id };
  } catch (error) { throw new HttpsError("internal", error.message); }
});

exports.updateStripePlanAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { productId, name, description, features, price, interval, badge, sortOrder, allowInstallments, maxInstallments, interestFree } = request.data;
  if (!productId) throw new HttpsError("invalid-argument", "ID do produto é obrigatório.");

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);
  const db = admin.firestore();

  try {
    await stripe.products.update(productId, { name: name, description: description });
    const configDoc = await db.collection("configs").doc("platform").get();
    if (!configDoc.exists) throw new Error("Configurações não encontradas.");

    const plans = configDoc.data().plans || [];
    const planIndex = plans.findIndex(p => p.id === productId);
    if (planIndex === -1) throw new Error("Plano não encontrado no banco.");

    const existingPlan = plans[planIndex];
    let newPriceId = existingPlan.priceId;

    if (parseFloat(price) !== parseFloat(existingPlan.price) || interval !== existingPlan.interval) {
      const priceData = { product: productId, unit_amount: Math.round(parseFloat(price) * 100), currency: "brl" };
      if (interval === 'bimestral') priceData.recurring = { interval: 'month', interval_count: 2 };
      else if (interval === 'trimestral') priceData.recurring = { interval: 'month', interval_count: 3 };
      else if (interval === 'semestral') priceData.recurring = { interval: 'month', interval_count: 6 };
      else if (interval !== 'one_time') priceData.recurring = { interval: interval || "month" };

      const stripePrice = await stripe.prices.create(priceData);
      newPriceId = stripePrice.id;
      try { await stripe.prices.update(existingPlan.priceId, { active: false }); } catch (e) { }
    }

    plans[planIndex] = {
      ...existingPlan, name, description, price, interval, features: features || [], priceId: newPriceId,
      badge: badge || "", sortOrder: parseInt(sortOrder) || 0, allowInstallments: !!allowInstallments,
      maxInstallments: parseInt(maxInstallments) || 12, interestFree: !!interestFree, updatedAt: new Date().toISOString()
    };

    await db.collection("configs").doc("platform").update({ plans });
    return { success: true };
  } catch (error) { throw new HttpsError("internal", error.message); }
});

exports.deleteStripePlanAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { productId } = request.data;
  const db = admin.firestore();

  try {
    const configDoc = await db.collection("configs").doc("platform").get();
    if (configDoc.exists) {
      const plans = configDoc.data().plans || [];
      const planToDelete = plans.find(p => p.id === productId);
      const updatedPlans = plans.filter(p => p.id !== productId);
      await db.collection("configs").doc("platform").update({ plans: updatedPlans });

      if (planToDelete && planToDelete.priceId) {
        const stripeConfig = await getStripeConfig();
        const stripe = getStripeInstance(stripeConfig);
        try {
          await stripe.prices.update(planToDelete.priceId, { active: false });
          await stripe.products.update(productId, { active: false });
        } catch (e) { }
      }
    }
    return { success: true };
  } catch (error) { throw new HttpsError("internal", error.message); }
});

// ==========================================
// CANAL DE SUPORTE
// ==========================================

const getTransporter = (config = {}) => {
  const host = config.host || process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt(config.port) || parseInt(process.env.SMTP_PORT) || 465;

  return nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: { user: config.user || process.env.SMTP_USER || "Suporte@sitezing.com.br", pass: config.pass || process.env.SMTP_PASS || "SenhaPadraoAqui" },
    tls: { rejectUnauthorized: false }
  });
};

exports.submitSupportTicket = onCall({ cors: true }, async (request) => {
  const uid = ensureAuthed(request);
  const db = admin.firestore();
  const { subject, message, email, name, phone } = request.data;
  if (!subject || !message) throw new HttpsError("invalid-argument", "Assunto e mensagem são obrigatórios.");

  try {
    const ticketRef = db.collection("support_tickets").doc();
    await ticketRef.set({
      userId: uid, name: name || "Cliente", email: email || "Não informado", phone: phone || "", subject, message,
      status: "open", createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, ticketId: ticketRef.id };
  } catch (e) { throw new HttpsError("internal", "Erro ao processar sua solicitação."); }
});

exports.listSupportTicketsAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const db = admin.firestore();
  try {
    const snap = await db.collection("support_tickets").orderBy("createdAt", "desc").get();
    const tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { tickets };
  } catch (e) { throw new HttpsError("internal", "Erro ao carregar tickets."); }
});

exports.replySupportTicket = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const { ticketId, replyMessage, ticketEmail, ticketName, ticketSubject } = request.data;
  if (!ticketId || !replyMessage || !ticketEmail) throw new HttpsError("invalid-argument", "Dados de resposta incompletos.");

  const db = admin.firestore();
  try {
    const configDoc = await db.collection("configs").doc("platform").get();
    const smtpConfig = configDoc.exists ? configDoc.data().smtp || {} : {};
    const transporter = getTransporter(smtpConfig);

    const mailOptions = {
      from: smtpConfig.from ? `"Suporte SiteZing" <${smtpConfig.from}>` : '"Suporte SiteZing" <Suporte@sitezing.com.br>',
      to: ticketEmail, subject: `RE: ${ticketSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #f97316;">Olá, ${ticketName || 'Cliente'}!</h2>
          <p>Obrigado por entrar em contato com o suporte da <strong>SiteZing</strong>.</p>
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="white-space: pre-wrap; margin: 0;">${replyMessage}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">Se precisar de mais alguma coisa, basta responder diretamente a este e-mail.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; ${new Date().getFullYear()} SiteZing - Central de Relacionamento</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    await db.collection("support_tickets").doc(ticketId).update({
      status: "resolved", adminReply: replyMessage, repliedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await db.collection("email_logs").add({
      recipient: ticketEmail, subject: `RE: ${ticketSubject}`, type: "support", status: "success", sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (e) { return { success: false, error: e.message, code: e.code }; }
});

exports.testSmtpConfig = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso negado.");
  const { smtpConfig } = request.data;
  if (!smtpConfig || !smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) throw new HttpsError("invalid-argument", "Dados de SMTP incompletos.");

  try {
    const transporter = getTransporter(smtpConfig);
    await new Promise((resolve, reject) => { transporter.verify((error, success) => { if (error) reject(error); else resolve(success); }); });
    return { success: true, message: "Conexão estabelecida com sucesso!" };
  } catch (e) { return { success: false, error: e.message, code: e.code }; }
});

exports.listRecentEmailLogsAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) throw new HttpsError("permission-denied", "Acesso restrito.");
  const db = admin.firestore();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const snap = await db.collection("email_logs").where("sentAt", ">=", twentyFourHoursAgo).orderBy("sentAt", "desc").limit(50).get();
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { logs };
  } catch (err) { throw new HttpsError("internal", err.message); }
});
