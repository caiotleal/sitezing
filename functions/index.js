const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
const nodemailer = require("nodemailer");
const Stripe = require("stripe");
const crypto = require("crypto");

if (!admin.apps.length) {
  const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  admin.initializeApp({
    storageBucket: firebaseConfig.storageBucket || "sitezing-4714c.firebasestorage.app"
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

    // Retorna a URL pública padrão do Firebase Storage
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
 * Identifica e deleta todos os arquivos de imagem associados ao projeto no Storage.
 */
async function deleteProjectStorageAssets(projectData) {
  if (!projectData) return;
  const bucketName = storage.name;
  const urls = [];

  if (typeof projectData.heroImage === 'string') urls.push(projectData.heroImage);
  if (typeof projectData.aboutImage === 'string') urls.push(projectData.aboutImage);
  if (typeof projectData.customTemplate === 'string') {
    // Regex para pegar URLs do Google Storage no HTML
    const matches = projectData.customTemplate.match(/https?:\/\/storage\.googleapis\.com\/[^\/]+\/generated_images\/[^"'\s>]+/g);
    if (matches) urls.push(...matches);
  }

  const uniqueUrls = [...new Set(urls)];
  if (uniqueUrls.length > 0) {
    console.log(`[Cleanup] Iniciando limpeza de ${uniqueUrls.length} imagens para o projeto: ${projectData.projectSlug}`);
    for (const url of uniqueUrls) {
      if (url.includes(bucketName) && url.includes("/generated_images/")) {
        try {
          const fileName = url.split(`${bucketName}/`)[1];
          if (fileName) {
            const file = storage.file(fileName);
            const [exists] = await file.exists();
            if (exists) {
              await file.delete();
              console.log(`[Cleanup] Arquivo deletado: ${fileName}`);
            }
          }
        } catch (e) {
          console.warn(`[Cleanup] Erro ao processar ${url}:`, e.message);
        }
      }
    }
  }
}

/**
 * Remove valores 'undefined' recursivamente para evitar erros no Firestore.
 * Também converte objetos em JSON e de volta para remover qualquer referência não-serializável.
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'function') return null; // Firestore não aceita funções
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
const googleMapsKey = defineSecret("GOOGLE_MAPS_API_KEY");

const getProjectId = () => process.env.GCLOUD_PROJECT || JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId;

const getGeminiClient = () => {
  const apiKey = geminiKey.value();
  if (!apiKey) throw new HttpsError("failed-precondition", "Secret GEMINI_KEY ausente.");
  // v1.1.7: Switching to v1beta to support gemini-2.5-flash as requested
  return new GoogleGenerativeAI(apiKey, { apiVersion: "v1beta" });
};

const slugify = (value = "") => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

// Helper de Segurança: Valida se é um domínio ou slug seguro para evitar SSRF/Path Traversal
const isSafeInput = (str) => {
  if (!str || typeof str !== 'string') return false;
  // Permite apenas letras, números, hífens e pontos (para domínios)
  return /^[a-z0-9.-]+$/i.test(str) && !str.includes('..');
};

const ensureAuthed = (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Faça login para continuar.");
  return request.auth.uid;
};

async function getFirebaseAccessToken() {
  const auth = new GoogleAuth({
    scopes: [
      "https://www.googleapis.com/auth/firebase",
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token || tokenResponse;
}

// ============================================================================
// NOVO MOTOR DE ENTREGA RÁPIDA REACT (WILDCARD)
// ============================================================================
exports.getPublishedSiteContent = onRequest({ cors: true }, async (req, res) => {
  // Fix CORS for published subdomains explicitly
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const domain = req.query.domain || req.body?.data?.domain || req.body?.domain;
  if (!domain) {
    res.status(400).send({ error: "Domínio não informado." });
    return;
  }

  const db = admin.firestore();
  let projectSnap;
  const cleanHost = domain.replace(/^www\./, '').toLowerCase();

  try {
    // Se for o subdomínio gratuito da plataforma (ex: nome.sitezing.com.br)
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
      res.status(404).send({ error: "O site não foi encontrado no banco de dados." });
      return;
    }

    const project = projectSnap.docs[0].data();

    // Trava de Site Congelado
    if (project.status === "frozen") {
      res.status(403).send({ error: "Este site encontra-se temporariamente suspenso." });
      return;
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

    res.status(200).send({ data: { html } });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

const LAYOUTS_CONTEXT = {
  layout_modern_center: `<div class="template-layout-modern-center" style="background-color: {{COLOR_1}}; color: {{COLOR_4}}"><header class="p-6 flex justify-between items-center border-b border-opacity-10 backdrop-blur-md sticky top-0 z-50" style="background-color: {{COLOR_1}}; border-color: {{COLOR_3}}; color: {{COLOR_4}}">[[LOGO_AREA]]<div class="flex items-center gap-8"><nav class="hidden md:flex items-center gap-8 font-bold text-sm tracking-tight"><a href="#sobre" class="hover:opacity-60 transition-opacity">Sobre</a><a href="#contato" class="hover:opacity-60 transition-opacity">Contato</a></nav>[[SOCIAL_LINKS_CONTAINER]]</div></header><main><section class="py-32 px-6 text-center"><div class="max-w-4xl mx-auto"><h1 class="text-6xl md:text-8xl font-black mb-8 leading-tight animate-fade-up">{{HERO_TITLE}}</h1><p class="text-xl md:text-2xl opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed">{{HERO_SUBTITLE}}</p><a href="#contato" class="inline-block px-10 py-5 rounded-full font-bold text-lg shadow-2xl transition-all transform hover:scale-105 active:scale-95" style="background-color: {{COLOR_7}}; color: {{COLOR_1}}">{{CONTACT_CALL}}</a></div></section><section id="sobre" class="py-24 px-6" style="background-color: {{COLOR_2}}"><div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center"><div class="aspect-video rounded-3xl overflow-hidden shadow-2xl">[[ABOUT_IMAGE]]</div><div><h2 class="text-4xl font-black mb-8">{{ABOUT_TITLE}}</h2><div class="text-lg leading-relaxed opacity-90">{{ABOUT_TEXT}}</div></div></div></section>[[REVIEWS_AREA]]<section id="contato" class="py-24 px-6"><div class="max-w-4xl mx-auto text-center"><h2 class="text-4xl font-black mb-12">Entre em Contato</h2><div class="grid md:grid-cols-3 gap-8 mb-16"><div class="p-8 rounded-3xl" style="background-color: {{COLOR_3}}"><i class="fas fa-phone-alt text-2xl mb-4" style="color: {{COLOR_7}}"></i><h4 class="font-bold mb-2">Telefone</h4><p class="opacity-80">{{PHONE}}</p></div><div class="p-8 rounded-3xl" style="background-color: {{COLOR_3}}"><i class="fas fa-envelope text-2xl mb-4" style="color: {{COLOR_7}}"></i><h4 class="font-bold mb-2">Email</h4><p class="opacity-80">{{EMAIL}}</p></div><div class="p-8 rounded-3xl" style="background-color: {{COLOR_3}}"><i class="fas fa-map-marker-alt text-2xl mb-4" style="color: {{COLOR_7}}"></i><h4 class="font-bold mb-2">Localização</h4><p class="opacity-80">{{ADDRESS}}</p></div></div>[[MAP_AREA]]</div></section></main><footer class="py-12 px-6 border-t border-opacity-10" style="border-color: {{COLOR_3}}"><div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">[[LOGO_AREA]]<p class="opacity-50 tracking-wider">© 2026 {{BUSINESS_NAME}}</p>[[SOCIAL_LINKS_CONTAINER]]</div></footer></div>`,
  layout_modern_split: `<div class="template-layout-modern-split" style="background-color: {{COLOR_LIGHT}}; color: {{COLOR_DARK}}"><header class="p-6 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md" style="background-color: {{COLOR_LIGHT}}; color: {{COLOR_DARK}}">[[LOGO_AREA]]<div class="flex items-center gap-8"><nav class="flex items-center gap-8"><a href="#sobre" class="font-bold hover:opacity-50 transition-opacity">História</a><a href="#contato" class="font-bold hover:opacity-50 transition-opacity">Falar Agora</a></nav>[[SOCIAL_LINKS_CONTAINER]]</div></header><main><section class="min-h-screen flex flex-col md:flex-row"><div class="md:w-1/2 p-12 md:p-24 flex flex-col justify-center order-2 md:order-1"><h1 class="text-5xl md:text-7xl font-black mb-8 leading-tight">{{HERO_TITLE}}</h1><p class="text-xl opacity-70 mb-12 leading-relaxed">{{HERO_SUBTITLE}}</p><div><a href="#contato" class="inline-block px-12 py-5 rounded-xl font-bold text-lg shadow-lg transition-transform hover:-translate-y-1" style="background-color: {{COLOR_7}}; color: white">Começar Jornada</a></div></div><div class="md:w-1/2 order-1 md:order-2">[[HERO_IMAGE]]</div></section><section id="sobre" class="py-32 px-6"><div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-20"><div class="md:w-1/2"><h2 class="text-4xl font-black mb-10 italic border-l-8 pl-8" style="border-color: {{COLOR_7}}">O que nos move</h2><div class="text-lg opacity-80 leading-loose">{{ABOUT_TEXT}}</div></div><div class="md:w-1/2 relative"><div class="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-20" style="background-color: {{COLOR_7}}"></div>[[ABOUT_IMAGE]]</div></div></section>[[REVIEWS_AREA]]<section id="contato" class="py-32 text-white" style="background-color: {{COLOR_DARK}}"><div class="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-20"><div><h2 class="text-5xl font-black mb-8">Vamos Criar<br/>Algo Novo?</h2><p class="text-lg opacity-70 mb-12">Estamos ansiosos para ouvir sua idéia e transformar em realidade.</p><div class="space-y-6"><div class="flex items-center gap-4"><span class="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-10"><i class="fab fa-whatsapp"></i></span><span>{{PHONE}}</span></div><div class="flex items-center gap-4"><span class="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-10"><i class="fas fa-map-pin"></i></span><span>{{ADDRESS}}</span></div></div></div><div class="bg-white p-10 rounded-[2rem]">[[MAP_AREA]]</div></div></section></main><footer class="py-12 px-6 bg-white flex flex-col md:flex-row justify-between items-center gap-4 border-t">[[LOGO_AREA]]<div class="flex gap-4">[[SOCIAL_LINKS]]</div><p class="font-bold opacity-30 text-sm">© 2026 {{BUSINESS_NAME}}</p></footer></div>`,
  layout_glass_grid: `<div class="template-layout-glass-grid" style="background-color: {{COLOR_1}}; color: {{COLOR_4}}; font-family: 'Inter', sans-serif;"><header class="p-8 flex justify-between items-center sticky top-0 z-50"><div class="backdrop-blur-xl bg-white bg-opacity-5 border border-white border-opacity-10 px-8 py-3 rounded-full flex items-center gap-8 shadow-2xl" style="background-color: {{COLOR_1}}; color: {{COLOR_4}}">[[LOGO_AREA]]<nav class="hidden md:flex items-center gap-8 text-sm font-medium tracking-widest uppercase"><a href="#sobre" class="hover:text-{{COLOR_7}} transition-colors">Negócio</a><a href="#contato" class="hover:text-{{COLOR_7}} transition-colors">Falar</a></nav></div>[[SOCIAL_LINKS_CONTAINER]]</header><main class="max-w-7xl mx-auto px-6 py-12"><div class="grid md:grid-cols-12 gap-8"><div class="md:col-span-8 p-12 md:p-24 rounded-[3rem] shadow-inner border border-white border-opacity-5 flex flex-col justify-center relative overflow-hidden" style="background-color: {{COLOR_2}}"><div class="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-20 rounded-full" style="background-color: {{COLOR_7}}"></div><h1 class="text-6xl md:text-7xl font-black mb-8 leading-tight relative z-10">{{HERO_TITLE}}</h1><p class="text-xl md:text-2xl opacity-60 mb-12 max-w-xl leading-relaxed relative z-10">{{HERO_SUBTITLE}}</p><div class="relative z-10"><a href="#contato" class="inline-flex items-center gap-4 px-12 py-5 rounded-full font-black text-lg transition-all hover:bg-white hover:text-black hover:scale-105" style="background-color: {{COLOR_7}}; color: {{COLOR_1}}">{{CONTACT_CALL}} <i class="fas fa-arrow-right"></i></a></div></div><div class="md:col-span-4 rounded-[3rem] overflow-hidden group shadow-2xl">[[HERO_IMAGE]]</div><div class="md:col-span-4 rounded-[3rem] overflow-hidden group shadow-2xl h-[400px]">[[ABOUT_IMAGE]]</div><div class="md:col-span-8 p-12 md:p-20 rounded-[3rem] backdrop-blur-3xl border border-white border-opacity-5 flex flex-col justify-center" style="background-color: {{COLOR_3}}"><h2 class="text-3xl md:text-5xl font-black mb-8">{{ABOUT_TITLE}}</h2><div class="text-lg md:text-xl opacity-70 leading-loose">{{ABOUT_TEXT}}</div></div></div>[[REVIEWS_AREA]]<div class="mt-8 p-12 md:p-24 rounded-[4rem] text-center relative overflow-hidden" id="contato" style="background-color: {{COLOR_2}}"><h2 class="text-5xl md:text-7xl font-black mb-16 italic">Entre no Loop</h2><div class="grid md:grid-cols-3 gap-12 relative z-10"><div class="space-y-4"><span class="text-xs uppercase tracking-[0.3em] opacity-40 font-black">Conectar</span><p class="text-2xl font-bold">{{PHONE}}</p></div><div class="space-y-4"><span class="text-xs uppercase tracking-[0.3em] opacity-40 font-black">Email</span><p class="text-2xl font-bold">{{EMAIL}}</p></div><div class="space-y-4"><span class="text-xs uppercase tracking-[0.3em] opacity-40 font-black">Onde estamos</span><p class="text-2xl font-bold">{{ADDRESS}}</p></div></div><div class="mt-20 rounded-[3rem] overflow-hidden border border-white border-opacity-10">[[MAP_AREA]]</div></div></main><footer class="p-12 text-center"><p class="text-sm opacity-20 font-black uppercase tracking-[1em]">© 2026 {{BUSINESS_NAME}}</p></footer></div>`,
  layout_minimal_elegance: `<div class="template-layout-minimal-elegance" style="background-color: white; color: #111; font-family: 'Playfair Display', serif;"><header class="p-10 flex flex-col items-center gap-10 sticky top-0 bg-white z-50">[[LOGO_AREA]]<div class="flex items-center gap-10"><nav class="flex gap-12 text-sm font-light tracking-[0.2em] uppercase border-y py-4 px-10 border-black border-opacity-10"><a href="#sobre" class="hover:opacity-50 transition-opacity">Nossa Essência</a><a href="#contato" class="hover:opacity-50 transition-opacity">Atendimento</a></nav>[[SOCIAL_LINKS_CONTAINER]]</div></header><main class="max-w-5xl mx-auto px-6"><section class="py-32 text-center"><h1 class="text-5xl md:text-8xl font-light mb-12 tracking-tight italic">{{HERO_TITLE}}</h1><p class="text-lg md:text-xl font-light opacity-60 mb-16 max-w-2xl mx-auto leading-relaxed">{{HERO_SUBTITLE}}</p><a href="#contato" class="inline-block border border-black px-16 py-5 hover:bg-black hover:text-white transition-all duration-500 uppercase text-xs tracking-widest font-black">{{CONTACT_CALL}}</a></section><section class="py-12"><div class="aspect-[16/6] overflow-hidden rounded-sm grayscale hover:grayscale-0 transition-all duration-1000">[[HERO_IMAGE]]</div></section><section id="sobre" class="py-32 grid md:grid-cols-2 gap-24 items-center"><div class="order-2 md:order-1"><h2 class="text-3xl font-light mb-12 tracking-widest uppercase border-b pb-4">{{ABOUT_TITLE}}</h2><div class="text-xl font-light leading-relaxed opacity-80">{{ABOUT_TEXT}}</div></div><div class="order-1 md:order-2 aspect-square overflow-hidden bg-gray-100">[[ABOUT_IMAGE]]</div></section>[[REVIEWS_AREA]]<section id="contato" class="py-32 border-t border-black border-opacity-5"><div class="text-center max-w-2xl mx-auto"><h2 class="text-xs uppercase tracking-[0.5em] font-black mb-16 opacity-30 text-center">Contact Details</h2><div class="space-y-12"><div><h4 class="font-black italic mb-2">Social</h4><p class="text-2xl font-light">{{PHONE}}</p></div><div><h4 class="font-black italic mb-2">Location</h4><p class="text-2xl font-light">{{ADDRESS}}</p></div></div><div class="mt-20 grayscale border border-black border-opacity-5 p-2">[[MAP_AREA]]</div></div></section></main><footer class="p-20 text-center border-t border-black border-opacity-5">[[LOGO_AREA]]<p class="mt-10 text-[10px] uppercase tracking-[0.3em] opacity-40">© 2026 {{BUSINESS_NAME}} — Designed for Elegance</p></footer></div>`,
  layout_dynamic_flow: `<div class="template-layout-dynamic-flow" style="background-color: {{COLOR_1}}; color: {{COLOR_4}}"><header class="p-6 flex justify-between items-center sticky top-0 z-50 backdrop-blur-lg" style="background-color: {{COLOR_1}}; color: {{COLOR_4}}"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-full overflow-hidden" style="background-color: {{COLOR_7}}">[[LOGO_AREA]]</div><span class="font-black tracking-tighter text-xl">{{BUSINESS_NAME}}</span></div>[[SOCIAL_LINKS_CONTAINER]]</header><main class="overflow-x-hidden"><section class="min-h-screen flex items-center justify-center p-6 relative"><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br opacity-5" style="background-image: linear-gradient(to bottom right, {{COLOR_7}}, transparent)"></div><div class="max-w-5xl mx-auto text-center relative z-10 translate-y-10 opacity-0 animate-reveal"><span class="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-8" style="background-color: {{COLOR_7}}; color: {{COLOR_1}}">Novo Lançamento</span><h1 class="text-6xl md:text-9xl font-black mb-10 tracking-tighter leading-none">{{HERO_TITLE}}</h1><p class="text-xl md:text-2xl opacity-70 mb-16 max-w-2xl mx-auto leading-tight">{{HERO_SUBTITLE}}</p><a href="#contato" class="group relative inline-flex items-center gap-4 text-2xl font-black">{{CONTACT_CALL}}<span class="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-2" style="background-color: {{COLOR_7}}; color: {{COLOR_1}}"><i class="fas fa-chevron-right"></i></span></a></div></section><section id="sobre" class="py-32 px-6"><div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-24"><div class="relative"><div class="absolute -bottom-8 -right-8 w-full h-full rounded-[4rem] z-0" style="background-color: {{COLOR_3}}"></div>[[ABOUT_IMAGE]]</div><div class="md:w-1/2"><h2 class="text-5xl font-black mb-10 leading-tight">{{ABOUT_TITLE}}</h2><div class="text-lg opacity-80 leading-relaxed space-y-6">{{ABOUT_TEXT}}</div></div></div></section>[[REVIEWS_AREA]]<section class="py-32 px-6" style="background-color: {{COLOR_2}}"><div class="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-24"><div class="md:w-1/2">[[HERO_IMAGE]]</div><div class="md:w-1/2"><h2 class="text-5xl font-black mb-10 leading-tight">Excelência <br/>em Movimento</h2><p class="text-xl opacity-70 leading-relaxed italic">"Nós não apenas entregamos resultados, nós criamos experiências que definem o futuro do seu negócio."</p></div></div></section><section id="contato" class="py-32 px-6 relative overflow-hidden"><div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 relative z-10"><div class="p-12 rounded-[4rem] flex flex-col justify-between" style="background-color: {{COLOR_3}}"><h2 class="text-5xl font-black mb-12 italic">Fale Conosco</h2><div class="space-y-8"><div><span class="block text-xs font-black uppercase opacity-40 mb-2">Direct Line</span><p class="text-3xl font-black tracking-tighter">{{PHONE}}</p></div><div><span class="block text-xs font-black uppercase opacity-40 mb-2">Location</span><p class="text-3xl font-black tracking-tighter">{{ADDRESS}}</p></div></div></div><div class="rounded-[4rem] overflow-hidden shadow-2xl border-8 border-opacity-10 border-white">[[MAP_AREA]]</div></div></section></main><footer class="p-12 flex flex-col md:flex-row justify-between items-center gap-8 bg-black bg-opacity-20">[[LOGO_AREA]]<div class="flex gap-6 items-center">[[SOCIAL_LINKS]] [[SOCIAL_LINKS_CONTAINER]]</div><p class="text-[10px] font-black uppercase opacity-20 tracking-tighter">© 2026 {{BUSINESS_NAME}}. Powered by SiteZing Dynamic Flow.</p></footer></div>`
};

const SYSTEM_RULES = `Você é o motor de inteligência artificial do gerador de sites SiteZing. Sua função principal é atuar como um Copywriter e Designer focado em aprimorar templates pré-existentes.

REGRAS ABSOLUTAS DE FUNCIONAMENTO:

1. BLOQUEIO DE ESTRUTURA (NUNCA CRIE DO ZERO):
Você está estritamente proibido de criar layouts, componentes React ou estruturas HTML do zero. Você deve OBRIGATORIAMENTE carregar e utilizar um dos templates padrão do sistema.

2. GERAÇÃO DE CONTEÚDO:
Quando o usuário fornecer apenas 'Nome' e 'Descrição', use sua inteligência para expandir esses dados em uma copy vendedora, profissional e engajadora. Substitua os textos genéricos (Lorem Ipsum) do template base por esses novos textos gerados, mantendo o tom adequado ao nicho do cliente.

3. ESTILIZAÇÃO SEGURA E DINÂMICA:
Você tem permissão para alterar classes de espaçamento, tipografia e bordas (Tailwind) no template base. No entanto, é ESTREITAMENTE PROIBIDO o uso de classes de cores fixas (ex: text-blue-600, bg-slate-900, hexadecimais). Use OBRIGATORIAMENTE os tokens do sistema: {{COLOR_1}}, {{COLOR_2}}, {{COLOR_3}}, {{COLOR_4}}, {{COLOR_DARK}}, {{COLOR_LIGHT}} e {{COLOR_7}} (Cor de Destaque/Ação). Isso garante que o usuário possa trocar as cores no painel lateral.

4. PREVIEW E EDIDABILIDADE:
Não adicione, remova ou altere a hierarquia das tags HTML principais. Não mude os nomes das funções exportadas e não remova as tags de identificação de edição do sistema (como {{HERO_TITLE}}, [[HERO_IMAGE]], etc). Sua customização deve ser feita no campo 'customTemplate' do JSON, devolvendo o HTML completo e refinado.`;

// ============================================================================
// INTELIGÊNCIA ARTIFICIAL E GESTÃO DE PROJETOS
// ============================================================================
async function callImagen(prompt, apiKey) {
  try {
    const refinedPrompt = `A high-end, realistic commercial photograph of: ${prompt}. Shot on a 35mm lens, natural lighting, authentic detailed textures. Pure photography.`;
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
  try {
    const uid = ensureAuthed(request);
    const { businessName, description, region, googleContext } = request.data;
    if (!businessName) throw new HttpsError("invalid-argument", "Nome obrigatório");

    // Cache Logic con Fallback
    let cacheKey = "";
    try {
      cacheKey = crypto.createHash('md5').update(JSON.stringify({
        bn: businessName || "", ds: description || "", rg: region || "", gc: googleContext || null
      })).digest('hex');
      const cacheDoc = await admin.firestore().collection("site_generation_cache").doc(cacheKey).get();
      if (cacheDoc.exists) return cacheDoc.data();
    } catch (e) { console.warn("Cache error:", e.message); }

    const genAI = getGeminiClient();

    // Designer Engine: Informando os templates disponíveis para a IA
    const templatesBrief = `
    LAYOUTS DISPONÍVEIS:
    1. 'default': Simples, profissional, limpo. Ideal para negócios locais tradicionais.
    2. 'layout_modern_center': Impactante, fontes gigantes, focado em branding e autoridade. Ideal para agências e consultores.
    3. 'layout_modern_split': Lado a lado, elegante, ótimo para destacar uma imagem principal e texto. Ideal para spas, arquitetos e design.
    4. 'layout_glass_grid': Moderno, futurista, estilo Apple/Tech. Ideal para startups e empresas disruptivas.
    5. 'layout_minimal_elegance': Minimalista, luxuoso, fontes serifadas. Ideal para moda, joalherias e direito.
    6. 'layout_dynamic_flow': Energético, transições fluidas, estilo streetwear. Ideal para academias e criativos.
    `;

    // DEPLOY_SALT: 2026-04-02-TEMPLATE-FIRST-V24
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2048 }
    });

    let prompt = `Você é um Copywriter Especialista. Sua função é gerar o melhor conteúdo de vendas e branding para o site do cliente.
    
    DADOS DO NEGÓCIO:
    Nome: "${businessName}"
    Descrição: "${description}"
    Região: "${region || "Brasil"}"
    ${googleContext ? `DADOS_GOOGLE: ${googleContext}` : ""}

    SUA MISSÃO:
    1. Escolha o 'layoutKey' mais adequado entre os disponíveis no sistema.
    2. Crie uma copy persuasiva que destaque os diferenciais do negócio.
    3. Retorne APENAS um JSON estruturado:
    {
      "layoutKey": "string",
      "heroTitle": "Título impactante da capa",
      "heroSubtitle": "Subtítulo engajador",
      "aboutTitle": "Título da seção Sobre",
      "aboutText": "Texto detalhado contando a história/missão (3-4 parágrafos)",
      "contactCall": "Chamada para ação (ex: Agendar Agora)",
      "heroImagePrompt": "High-end commercial photography prompt in English for the hero section",
      "aboutImagePrompt": "Professional environment photography prompt in English for the about section"
    }`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    let aiData;

    try {
      const startIdx = rawText.indexOf('{');
      const endIdx = rawText.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) throw new Error("JSON Indetectável");
      aiData = JSON.parse(rawText.substring(startIdx, endIdx + 1));
    } catch (parseErr) {
      console.error("[GenerateSite] AI returned invalid JSON:", rawText);
      throw new HttpsError("internal", "A IA gerou um formato inválido. Por favor, tente novamente com uma descrição mais clara.");
    }

    // --- MOTOR DE INJEÇÃO (TEMPLATE-FIRST) ---
    // Escolhe o template base baseado no layoutKey da IA ou fallback
    const layoutKey = aiData.layoutKey || 'layout_modern_center';
    let htmlTemplate = LAYOUTS_CONTEXT[layoutKey] || LAYOUTS_CONTEXT['layout_modern_center'];

    // Mapeamento de chaves para substituição
    const replacements = {
      "{{BUSINESS_NAME}}": businessName,
      "{{HERO_TITLE}}": aiData.heroTitle,
      "{{HERO_SUBTITLE}}": aiData.heroSubtitle,
      "{{ABOUT_TITLE}}": aiData.aboutTitle,
      "{{ABOUT_TEXT}}": aiData.aboutText,
      "{{CONTACT_CALL}}": aiData.contactCall,
      "{{PHONE}}": "DADO DO CLIENTE",
      "{{EMAIL}}": "DADO DO CLIENTE",
      "{{ADDRESS}}": region || "Brasil"
    };

    // Aplica as substituições de forma robusta
    for (const [key, value] of Object.entries(replacements)) {
      htmlTemplate = htmlTemplate.split(key).join(value || "");
    }

    // Devolve o HTML injetado para o editor como 'customTemplate'
    aiData.customTemplate = htmlTemplate;

    // Foto-Realismo com Imagen 4
    const [heroImage, aboutImage] = await Promise.all([
      callImagen(aiData.heroImagePrompt || businessName, geminiKey.value()),
      callImagen(aiData.aboutImagePrompt || businessName, geminiKey.value())
    ]);

    const finalResponse = { ...aiData, heroImage, aboutImage };

    if (cacheKey) {
      try { await admin.firestore().collection("site_generation_cache").doc(cacheKey).set({ ...finalResponse, cachedAt: admin.firestore.FieldValue.serverTimestamp() }); }
      catch (e) { }
    }

    return finalResponse;
  } catch (error) {
    console.error("[GenerateSite error]", error.stack);
    throw new HttpsError("internal", error.message);
  }
});

exports.generateImage = onCall({ cors: true, timeoutSeconds: 120, secrets: [geminiKey] }, async (request) => {
  const uid = ensureAuthed(request); // Anti-bot: Exige Auth (Anônima ou Conta)
  const { prompt } = request.data;
  if (!prompt) throw new HttpsError("invalid-argument", "O descritivo da imagem é obrigatório.");

  try {
    const refinedPrompt = `A high-end, realistic commercial photograph of: ${prompt}. Shot on a 35mm lens, natural lighting, authentic detailed textures. Pure photography.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${geminiKey.value()}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [{ prompt: refinedPrompt }], parameters: { sampleCount: 1, aspectRatio: "1:1" } })
    });
    const data = await response.json();
    const base64 = `data:${data.predictions[0].mimeType || "image/jpeg"};base64,${data.predictions[0].bytesBase64Encoded}`;
    const imageUrl = await uploadBase64ToStorage(base64);
    return { imageUrl };
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

  // Tagging Anonymous Users for Cleanup logic
  const isAnonymous = request.auth.token.firebase.sign_in_provider === "anonymous";
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set({
      activeUser: true,
      uid: uid,
      isAnonymous: isAnonymous,
      userCreatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    // Update anonymity status (in case they just signed in/up)
    await userRef.update({ isAnonymous: isAnonymous });
  }

  // Limpa o HTML removendo imagens pesadas em base64 e movendo para o Storage
  const cleanedHtml = await cleanHtmlImages(generatedHtml);

  // Sanitiza objetos para evitar erro 'invalid nested entity' (undefined) no Firestore
  const safeAiContent = sanitizeObject(aiContent);
  const safeFormData = sanitizeObject(formData);

  const now = admin.firestore.FieldValue.serverTimestamp();
  await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectSlug).set({
    uid, businessName, projectSlug, internalDomain: projectSlug,
    officialDomain: officialDomain || "Pendente", generatedHtml: cleanedHtml, formData: safeFormData, aiContent: safeAiContent,
    updatedAt: now, createdAt: now, 
    status: "draft", 
    paymentStatus: "pending",
    expiresAt: null,
    // NOVO OBJETO DE ASSINATURA (CONFORME SOLICITADO NO PROMPT)
    assinatura: {
      status: "pendente",
      data_inicio: null,
      data_expiracao: null,
      periodo: "nenhum"
    }
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

  // Limpa o HTML removendo imagens pesadas em base64 e movendo para o Storage
  const cleanedHtml = await cleanHtmlImages(html);

  // Sanitiza objetos para evitar erro 'invalid nested entity' (undefined) no Firestore
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

    // VERIFICAÇÃO DE IDENTIDADE (KYC)
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data() || {};
    const requiredFields = ["fullName", "document", "phone", "address"];
    const missingFields = requiredFields.filter(f => !userData[f]);

    if (missingFields.length > 0) {
      throw new HttpsError("failed-precondition", `Perfil incompleto. Campos obrigatórios: ${missingFields.join(", ")}`);
    }

    // MODERAÇÃO DE CONTEÚDO IA ANTES DE PUBLICAR
    // DEPLOY_SALT: 2026-04-02-AI-SYNC-V2
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const modPrompt = `Analise o seguinte conteúdo de site e responda 'SAFE' ou 'UNSAFE'. 
    Marque como 'UNSAFE' se contiver: pornografia, violência explícita, apologia a crimes, drogas ilícitas ou golpes. 
    Conteúdo: ${project.generatedHtml.substring(0, 5000)}`;

    const modResult = await model.generateContent(modPrompt);
    const modText = modResult.response.text().trim().toUpperCase();

    if (modText.includes("UNSAFE")) {
      await ref.update({ status: "blocked", moderatorNote: "Conteúdo violou políticas de segurança." });
      throw new HttpsError("permission-denied", "Seu site foi bloqueado por violar nossas políticas de conteúdo seguro.");
    }

    // GERA A URL OFICIAL USANDO O WILDCARD
    const subdomainVal = `${project.projectSlug}.sitezing.com.br`;
    const publicUrl = `https://${subdomainVal}`;

    // REGISTRA O SUBDOMÍNIO NO FIREBASE HOSTING PARA SSL E ROTEAMENTO
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
    
    // 1. LIMPEZA DE ASSETS (IMAGENS DO STORAGE)
    try { await deleteProjectStorageAssets(project); } catch (e) { console.error("Erro na limpeza de assets:", e); }

    // 2. LIMPEZA DE DOMÍNIOS NO HOSTING
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
      console.error("ERRO: ID do Projeto não detectado nas variáveis de ambiente.");
      throw new HttpsError("failed-precondition", "Configuração de ID do projeto ausente no ambiente Cloud.");
    }

    const token = await getFirebaseAccessToken();
    const cleanDomain = (domain || "").trim().toLowerCase();
    if (!isSafeInput(cleanDomain)) throw new HttpsError("invalid-argument", "Domínio em formato inválido detectado.");

    const apiUrl = `https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains?customDomainId=${cleanDomain}`;

    console.log(`[CustomDomain] Iniciando vinculação de ${cleanDomain} para o projeto ${projectIdEnv}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    let domainData = {};
    const responseText = await response.text();
    try {
      if (responseText) domainData = JSON.parse(responseText);
    } catch (e) {
      console.error("[CustomDomain] Resposta não-JSON do Google:", responseText);
    }

    if (!response.ok) {
      console.error(`[CustomDomain] Erro Google API (${response.status}):`, domainData.error || responseText);
      if (domainData.error?.status === "ALREADY_EXISTS") {
        throw new HttpsError("already-exists", "Este domínio já está em uso em outro projeto Firebase.");
      }
      throw new HttpsError("unknown", `Erro Google: ${domainData.error?.message || "Erro desconhecido na API de Hosting"}`);
    }

    console.log(`[CustomDomain] Domínio principal ${cleanDomain} ok. Vinculando www...`);

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
    console.error("[CustomDomain] Erro Crítico:", error.message);
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

    console.log(`[CustomDomain] Removendo domínio ${cleanDomain} do projeto ${projectIdEnv}`);

    const res1 = await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/${cleanDomain}`, {
      method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res1.ok && res1.status !== 404) {
      console.warn(`[CustomDomain] Aviso ao remover ${cleanDomain}: ${res1.status}`);
    }

    const res2 = await fetch(`https://firebasehosting.googleapis.com/v1beta1/projects/${projectIdEnv}/sites/${projectIdEnv}/customDomains/www.${cleanDomain}`, {
      method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res2.ok && res2.status !== 404) {
      console.warn(`[CustomDomain] Aviso ao remover www.${cleanDomain}: ${res2.status}`);
    }

    await admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId).update({
      officialDomain: "Pendente",
      domainStatus: "PENDING",
      domainRecords: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("[CustomDomain] Erro ao remover:", error.message);
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
    } catch (e) {
      console.error("[CustomDomain] Resposta não-JSON na verificação:", responseText);
    }

    if (!response.ok) {
      console.error(`[CustomDomain] Erro ao verificar domínio (${response.status}):`, domainData.error || responseText);
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
    console.error("[CustomDomain] Erro Crítico na Verificação:", error.message);
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
  
  // Prioriza chaves específicas (prodSecretKey/testSecretKey), cai de volta para secretKey se disponível
  let key = isProd ? stripeConfig.prodSecretKey : stripeConfig.testSecretKey;
  if (!key) key = stripeConfig.secretKey; 

  if (!key) throw new Error(`Chave Secreta do Stripe (${isProd ? "PROD" : "TEST"}) não configurada corretamente.`);
  return new Stripe(key);
}

exports.testStripeConfig = onCall({ cors: true }, async (request) => {
  try {
    const { mode, prodSecretKey, testSecretKey, secretKey } = request.data || {};
    const isProd = mode === "prod";
    const key = isProd ? (prodSecretKey || secretKey) : (testSecretKey || secretKey);
    
    if (!key) throw new Error("Chave não informada.");
    
    const stripe = new Stripe(key);
    const balance = await stripe.balance.retrieve();
    
    return { 
      success: true, 
      message: `Conexão bem sucedida com Stripe (${isProd ? "PRODUÇÃO" : "TESTE"})!`,
      details: { currency: balance.available[0]?.currency || "brl" }
    };
  } catch (err) {
    return { success: false, message: "Erro na conexão Stripe: " + err.message };
  }
});

exports.testGeminiConfig = onCall({ cors: true, secrets: [geminiKey] }, async (request) => {
  try {
    const { customKey } = request.data || {};
    const apiKey = customKey || geminiKey.value();
    
    if (!apiKey) throw new Error("API Key ausente.");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Respond only 'OK'");
    const text = result.response.text();
    
    return { success: true, message: "Conexão bem sucedida com Google Gemini AI!" };
  } catch (err) {
    return { success: false, message: "Erro na conexão Gemini: " + err.message };
  }
});

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
    // PROTEÇÃO: Evita erro de 'No such price' com dados de exemplo do seeder
    if (priceId.includes("placeholder")) {
      throw new HttpsError("failed-precondition", "Este plano ainda não foi configurado corretamente no Stripe. Por favor, crie um plano real no Painel Administrativo.");
    }
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

  const sessionParams = {
    mode: 'subscription',
    line_items: [lineItem],
    success_url: `${safeOrigin}?payment=success&project=${projectId}`,
    cancel_url: `${safeOrigin}?payment=cancelled&project=${projectId}`,
    metadata: { projectId, planType, uid: request.auth.uid },
    client_reference_id: projectId,
    allow_promotion_codes: true,
    payment_method_collection: 'always',
  };

  // Habilitar Parcelamento (Stripe Brasil) se o plano permitir
  const db = admin.firestore();
  const configDoc = await db.collection("configs").doc("platform").get();
  if (configDoc.exists) {
    const plans = configDoc.data().plans || [];
    const targetPlan = plans.find(p => p.priceId === priceId || (p.id === priceId));

    // Se o plano for pagamento único OU se o parcelamento estiver habilitado, usar mode: 'payment'
    if (targetPlan?.interval === 'one_time' || targetPlan?.allowInstallments) {
      sessionParams.mode = 'payment';
      delete sessionParams.payment_method_collection;

      // Para o parcelamento no Brasil aparecer com mais confiabilidade
      sessionParams.payment_method_types = ['card'];
      sessionParams.billing_address_collection = 'required';
    }

    if (targetPlan?.allowInstallments) {
      // Importante: Parcelamento no Stripe Brasil Checkout só funciona em mode: 'payment'
      // E não aceita preços recorrentes. Precisamos converter para price_data único.
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
      } catch (e) {
        console.error("Erro ao converter preço recorrente para parcelamento:", e);
      }

      const installmentsConfig = { enabled: true };
      if (targetPlan.interestFree) {
        installmentsConfig.plan = {
          type: 'merchant_paid',
          count: parseInt(targetPlan.maxInstallments) || 12
        };
      }

      sessionParams.payment_method_options = {
        card: {
          installments: installmentsConfig
        }
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
  if (!endpointSecret) return res.status(500).send(`Critical: Webhook Secret (${isProd ? "PROD" : "TEST"}) not configured.`);

  const stripe = getStripeInstance(stripeConfig);

  let event;
  try { event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret); }
  catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const siteId = session.client_reference_id; // Identificação do Alvo (siteId)
    const planoTipo = (session.metadata?.planType || 'anual').toLowerCase();
    const uid = session.metadata?.uid;
    const paymentIntentId = session.payment_intent || session.id;

    if (siteId && uid) {
      try {
        const db = admin.firestore();
        const siteRef = db.collection("users").doc(uid).collection("projects").doc(siteId);
        const idempotencyRef = db.collection("processed_payments").doc(paymentIntentId);

        // --- TRANSAÇÃO ATÔMICA (Requisito estrito) ---
        await db.runTransaction(async (transaction) => {
          // 1. CONDIÇÃO DE IDEMPOTÊNCIA
          const idempDoc = await transaction.get(idempotencyRef);
          if (idempDoc.exists) {
            console.log(`[Webhook] Pagamento ${paymentIntentId} já processado.`);
            return;
          }

          // 2. LEITURA PARA CÁLCULO DE EXPIRAÇÃO
          const siteSnap = await transaction.get(siteRef);
          if (!siteSnap.exists) {
            console.error(`[Webhook] Site ${siteId} não encontrado.`);
            return;
          }

          const siteData = siteSnap.data();
          const now = new Date();
          
          // Cálculo do período contratado (mensal/anual/etc)
          const daysToAdd = 
            (planoTipo === 'anual' || planoTipo === 'year') ? 365 :
            (planoTipo === 'semestral') ? 180 :
            (planoTipo === 'trimestral') ? 90 :
            (planoTipo === 'bimestral') ? 60 : 
            (planoTipo === 'one_time') ? 36500 : 30; // Default mensal (30)

          // REGRAS DE RENOVAÇÃO (Obrigatórias no prompt)
          let baseDate = now;
          const currentExp = siteData.assinatura?.data_expiracao?.toDate() || siteData.expiresAt?.toDate();
          
          if (currentExp && currentExp > now) {
            // Regra de Renovação Antecipada: soma ao que já existia
            console.log(`[Renew] Somando ${daysToAdd} dias ao saldo futuro de ${currentExp}`);
            baseDate = currentExp;
          }

          const finalExpiration = new Date(baseDate.getTime());
          finalExpiration.setDate(finalExpiration.getDate() + daysToAdd);

          // 3. GRAVAÇÃO DOS DADOS (Campos obrigatórios: assinatura.*)
          transaction.set(idempotencyRef, { 
            processedAt: admin.firestore.FieldValue.serverTimestamp(), 
            siteId, uid, paymentIntentId
          });

          transaction.set(siteRef, {
            status: "published",
            paymentStatus: "paid",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(finalExpiration), // Compatibilidade
            // OBJETO CONFORME SOLICITADO
            assinatura: {
              status: "ativo",
              data_inicio: admin.firestore.FieldValue.serverTimestamp(),
              data_expiracao: admin.firestore.Timestamp.fromDate(finalExpiration),
              periodo: planoTipo
            }
          }, { merge: true });

          console.log(`✅ Webhook v2 OK: ${siteId} -> +${daysToAdd} dias.`);
        });

        // Limpeza de assinaturas antigas se necessário
        const currentData = (await siteRef.get()).data();
        if (session.mode === 'subscription' && currentData?.stripeSubscriptionId && session.subscription && currentData.stripeSubscriptionId !== session.subscription) {
          try { await stripe.subscriptions.cancel(currentData.stripeSubscriptionId); } catch (err) { }
        }

      } catch (error) {
        console.error("[Webhook Error] Falha na Transação:", error);
      }
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
  console.log("[ResumeSubscription] Iniciando...", JSON.stringify(request.data));
  const uid = ensureAuthed(request);
  const { projectId } = request.data || {};
  if (!projectId) throw new HttpsError("invalid-argument", "Código do projeto ausente.");

  try {
    const projectRef = admin.firestore().collection("users").doc(uid).collection("projects").doc(projectId);
    const snap = await projectRef.get();

    if (!snap.exists) {
      console.error("[ResumeSubscription] Projeto não encontrado:", projectId);
      throw new HttpsError("not-found", "Projeto não encontrado em sua conta.");
    }
    const project = snap.data();

    if (!project?.stripeSubscriptionId) {
      console.warn("[ResumeSubscription] Sem stripeSubscriptionId vinculado.");
      throw new HttpsError("failed-precondition", "Este site não possui uma assinatura vinculada para reativar. Se o período de teste expirou, use o botão 'Assinar' para contratar um novo plano.");
    }

    const stripeConfig = await getStripeConfig();
    const stripe = getStripeInstance(stripeConfig);

    console.log("[ResumeSubscription] Verificando assinatura no Stripe:", project.stripeSubscriptionId);

    try {
      // Primeiro verificamos o status da assinatura no Stripe
      const subscription = await stripe.subscriptions.retrieve(project.stripeSubscriptionId);
      console.log("[ResumeSubscription] Status da assinatura no Stripe:", subscription.status);

      if (subscription.status === 'canceled') {
        throw new HttpsError("failed-precondition", "A assinatura anterior (ID: " + project.stripeSubscriptionId + ") já foi totalmente cancelada no provedor e não pode ser reativada. Por favor, escolha um novo plano e faça o pagamento novamente.");
      }

      // Reativamos a assinatura (tiramos o agendamento de cancelamento)
      await stripe.subscriptions.update(project.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      await projectRef.update({
        cancelAtPeriodEnd: false,
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log("[ResumeSubscription] Reativado com sucesso!");
      return { success: true, message: "Assinatura reativada com sucesso!" };
    } catch (stripeError) {
      console.error("[ResumeSubscription] Erro na API do Stripe:", stripeError);
      throw new HttpsError("internal", "Erro no Stripe: " + (stripeError.message || "Erro desconhecido"));
    }
  } catch (error) {
    console.error("[ResumeSubscription] Erro Fatal:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Erro crítico no servidor: " + (error.message || "Tente novamente mais tarde."));
  }
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

// FAXINA DIÁRIA: Apagar usuários anônimos e seus projetos após 48 horas
exports.cleanupAnonymousUsers = onSchedule("every 24 hours", async (event) => {
  const db = admin.firestore();
  const auth = admin.auth();
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(fortyEightHoursAgo);

  console.log(`[Cleanup] Iniciando limpeza de usuários anônimos anteriores a: ${fortyEightHoursAgo.toISOString()}`);

  const snapshot = await db.collection("users")
    .where("isAnonymous", "==", true)
    .where("userCreatedAt", "<=", cutoffTimestamp)
    .get();

  console.log(`[Cleanup] Encontrados ${snapshot.size} usuários anônimos para remover.`);

  for (const userDoc of snapshot.docs) {
    const uid = userDoc.id;
    try {
      // 1. Apagar sub-coleção de projetos (Recursivo Manual)
      const projectsSnap = await userDoc.ref.collection("projects").get();
      const batch = db.batch();
      projectsSnap.forEach(p => batch.delete(p.ref));
      await batch.commit();

      // 2. Apagar documento do usuário
      await userDoc.ref.delete();

      // 3. Apagar no Auth (Opcional, mas recomendado para manter lista limpa)
      try {
        await auth.deleteUser(uid);
      } catch (authErr) {
        // Silencioso se o usuário já não existir no Auth
      }

      console.log(`[Cleanup] Removido usuário ${uid} e seus projetos.`);
    } catch (err) {
      console.error(`[Cleanup] Falha ao remover usuário ${uid}:`, err.message);
    }
  }
});

// ============================================================================
// GOOGLE PLACES API: BUSCAR NEGÓCIO
// ============================================================================
exports.fetchGoogleBusiness = onCall({ cors: true, secrets: [googleMapsKey] }, async (request) => {
  const uid = ensureAuthed(request);
  const { query } = request.data;
  if (!query) throw new HttpsError("invalid-argument", "Busca vazia.");

  const apiKey = googleMapsKey.value();
  if (!apiKey) throw new HttpsError("failed-precondition", "A API Key do Google Maps (GOOGLE_MAPS_API_KEY) ainda não foi configurada.");

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
    const errorData = err.response?.data?.error || {};
    const msg = errorData.message || err.message || "Erro desconhecido";
    const status = err.response?.status || 500;

    console.error(`[PlacesAPI] Erro ${status}:`, JSON.stringify(errorData));

    if (status === 403) {
      throw new HttpsError("failed-precondition", "A API Places (New) não está ativa no Google Cloud Console ou a chave não tem permissão.");
    }
    if (status === 401) {
      throw new HttpsError("unauthenticated", "Chave de API do Google Maps inválida.");
    }

    throw new HttpsError("internal", "Falha ao consultar o Google: " + msg);
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

  const projectData = projectDoc.data();
  // LIMPEZA DE ASSETS (IMAGENS DO STORAGE)
  try { await deleteProjectStorageAssets(projectData); } catch (e) { console.error("Erro na limpeza admin de assets:", e); }

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

  const { name, description, price, interval, features, badge, sortOrder, allowInstallments, maxInstallments, interestFree } = request.data;
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
    const priceData = {
      product: product.id,
      unit_amount: Math.round(parseFloat(price) * 100),
      currency: "brl",
    };

    if (interval === 'one_time') {
      // Sem propriedade recurring para pagamento único
    } else if (interval === 'bimestral') {
      priceData.recurring = { interval: 'month', interval_count: 2 };
    } else if (interval === 'trimestral') {
      priceData.recurring = { interval: 'month', interval_count: 3 };
    } else if (interval === 'semestral') {
      priceData.recurring = { interval: 'month', interval_count: 6 };
    } else {
      priceData.recurring = { interval: interval || "month" };
    }

    const stripePrice = await stripe.prices.create(priceData);

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
        badge: badge || "",
        sortOrder: parseInt(sortOrder) || 0,
        allowInstallments: !!allowInstallments,
        maxInstallments: parseInt(maxInstallments) || 12,
        interestFree: !!interestFree,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    });

    return { success: true, productId: product.id, priceId: stripePrice.id };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

exports.updateStripePlanAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }

  const { productId, name, description, features, price, interval, badge, sortOrder, allowInstallments, maxInstallments, interestFree } = request.data;
  if (!productId) throw new HttpsError("invalid-argument", "ID do produto é obrigatório.");

  const stripeConfig = await getStripeConfig();
  const stripe = getStripeInstance(stripeConfig);
  const db = admin.firestore();

  try {
    // 1. Atualizar Produto no Stripe
    await stripe.products.update(productId, {
      name: name,
      description: description,
    });

    // 2. Buscar planos atuais
    const configDoc = await db.collection("configs").doc("platform").get();
    if (!configDoc.exists) throw new Error("Configurações não encontradas.");

    const plans = configDoc.data().plans || [];
    const planIndex = plans.findIndex(p => p.id === productId);
    if (planIndex === -1) throw new Error("Plano não encontrado no banco.");

    const existingPlan = plans[planIndex];
    let newPriceId = existingPlan.priceId;

    // 3. Se o preço ou intervalo mudou, criar novo preço no Stripe
    // (Preços no Stripe são imutáveis em termos de valor/intervalo)
    if (parseFloat(price) !== parseFloat(existingPlan.price) || interval !== existingPlan.interval) {
      const priceData = {
        product: productId,
        unit_amount: Math.round(parseFloat(price) * 100),
        currency: "brl",
      };

      if (interval === 'one_time') {
        // Sem propriedade recurring para pagamento único
      } else if (interval === 'bimestral') {
        priceData.recurring = { interval: 'month', interval_count: 2 };
      } else if (interval === 'trimestral') {
        priceData.recurring = { interval: 'month', interval_count: 3 };
      } else if (interval === 'semestral') {
        priceData.recurring = { interval: 'month', interval_count: 6 };
      } else {
        priceData.recurring = { interval: interval || "month" };
      }

      const stripePrice = await stripe.prices.create(priceData);
      newPriceId = stripePrice.id;

      // Desativar preço antigo para não poluir o Stripe Dashboard
      try {
        await stripe.prices.update(existingPlan.priceId, { active: false });
      } catch (e) {
        console.error("Erro ao desativar preço antigo:", e);
      }
    }

    // 4. Atualizar no Firestore
    plans[planIndex] = {
      ...existingPlan,
      name,
      description,
      price,
      interval,
      features: features || [],
      priceId: newPriceId,
      badge: badge || "",
      sortOrder: parseInt(sortOrder) || 0,
      allowInstallments: !!allowInstallments,
      maxInstallments: parseInt(maxInstallments) || 12,
      interestFree: !!interestFree,
      updatedAt: new Date().toISOString()
    };

    await db.collection("configs").doc("platform").update({ plans });

    return { success: true };
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
      const planToDelete = plans.find(p => p.id === productId);
      const updatedPlans = plans.filter(p => p.id !== productId);
      await db.collection("configs").doc("platform").update({ plans: updatedPlans });

      // Desativar no Stripe também
      if (planToDelete && planToDelete.priceId) {
        const stripeConfig = await getStripeConfig();
        const stripe = getStripeInstance(stripeConfig);
        try {
          await stripe.prices.update(planToDelete.priceId, { active: false });
          // Também arquivamos o produto para não aparecer mais em buscas ou relatórios como ativo
          await stripe.products.update(productId, { active: false });
        } catch (e) {
          console.error("Erro ao desativar preço/produto na deleção:", e);
        }

      }
    }
    return { success: true };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

// ==========================================
// CANAL DE SUPORTE
// ==========================================

const getTransporter = (config = {}) => {
  const host = config.host || process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt(config.port) || parseInt(process.env.SMTP_PORT) || 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true para 465 (SSL), false para 587 (TLS/STARTTLS)
    auth: {
      user: config.user || process.env.SMTP_USER || "Suporte@sitezing.com.br",
      pass: config.pass || process.env.SMTP_PASS || "SenhaPadraoAqui"
    },
    // Adicionamos tls para aceitar certificados self-signed se necessário
    tls: {
      rejectUnauthorized: false
    }
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
      userId: uid,
      name: name || "Cliente",
      email: email || "Não informado",
      phone: phone || "",
      subject,
      message,
      status: "open",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, ticketId: ticketRef.id };
  } catch (e) {
    console.error("Erro ao salvar ticket:", e);
    throw new HttpsError("internal", "Erro ao processar sua solicitação.");
  }
});

exports.listSupportTicketsAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }

  const db = admin.firestore();
  try {
    const snap = await db.collection("support_tickets").orderBy("createdAt", "desc").get();
    const tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { tickets };
  } catch (e) {
    throw new HttpsError("internal", "Erro ao carregar tickets.");
  }
});

exports.replySupportTicket = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito ao administrador.");
  }

  const { ticketId, replyMessage, ticketEmail, ticketName, ticketSubject } = request.data;
  if (!ticketId || !replyMessage || !ticketEmail) {
    throw new HttpsError("invalid-argument", "Dados de resposta incompletos.");
  }

  const db = admin.firestore();
  try {
    // 1. Buscar Configurações de SMTP dinâmicas do Firestore
    const configDoc = await db.collection("configs").doc("platform").get();
    const platformData = configDoc.exists ? configDoc.data() : {};
    const smtpConfig = platformData.smtp || {};

    // 2. Enviar Email via Nodemailer
    const transporter = getTransporter(smtpConfig);

    const mailOptions = {
      from: smtpConfig.from ? `"Suporte SiteZing" <${smtpConfig.from}>` : '"Suporte SiteZing" <Suporte@sitezing.com.br>',
      to: ticketEmail,
      subject: `RE: ${ticketSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #f97316;">Olá, ${ticketName || 'Cliente'}!</h2>
          <p>Obrigado por entrar em contato com o suporte da <strong>SiteZing</strong>.</p>
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="white-space: pre-wrap; margin: 0;">${replyMessage}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">
            Se precisar de mais alguma coisa, basta responder diretamente a este e-mail.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            &copy; ${new Date().getFullYear()} SiteZing - Central de Relacionamento
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email de suporte enviado com sucesso:", info.messageId);

    // 2. Marcar Ticket como Concluído no Firestore
    await db.collection("support_tickets").doc(ticketId).update({
      status: "resolved",
      adminReply: replyMessage,
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Registrar Log de Envio
    await db.collection("email_logs").add({
      recipient: ticketEmail,
      subject: `RE: ${ticketSubject}`,
      type: "support",
      status: "success",
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (e) {
    console.error("Erro ao responder ticket:", e);
    // Em vez de dar throw em 500, retornamos o erro estruturado para o CPanel ler
    return {
      success: false,
      error: e.message,
      code: e.code,
      command: e.command,
      stack: e.stack
    };
  }
});

exports.testSmtpConfig = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso negado.");
  }

  const { smtpConfig } = request.data;
  if (!smtpConfig || !smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
    throw new HttpsError("invalid-argument", "Dados de SMTP incompletos para o teste.");
  }

  try {
    const transporter = getTransporter(smtpConfig);
    // verify() retorna uma Promise (ou callback) que valida a conexão
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) reject(error);
        else resolve(success);
      });
    });

    return {
      success: true,
      message: "Conexão estabelecida com sucesso! O servidor SMTP aceitou as credenciais."
    };
  } catch (e) {
    console.error("Erro no teste de SMTP:", e);
    return {
      success: false,
      error: e.message,
      code: e.code,
      command: e.command,
      stack: e.stack // Útil para debug avançado no log do CPanel
    };
  }
});

/**
 * SISTEMA DE RECUPERAÇÃO DE CARRINHO ABANDONADO (E-mails)
 * Busca sites não publicados e envia um lembrete após 24h.
 */
async function processRecoveryCampaign(db) {
  console.log("Iniciando campanha de recuperação de sites abandonados...");

  // 1. Buscar Configurações SMTP
  const configDoc = await db.collection("configs").doc("platform").get();
  const platformData = configDoc.exists ? configDoc.data() : {};
  const smtpConfig = platformData.smtp || {};

  if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
    console.warn("SMTP não configurado. Abortando campanha de recuperação.");
    return { success: false, message: "SMTP não configurado." };
  }

  const transporter = getTransporter(smtpConfig);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // 2. Buscar Projetos Abandonados (Status active e updatedAt entre 24-48h)
  const projectsSnap = await db.collectionGroup("projects")
    .where("status", "==", "active")
    .where("updatedAt", "<=", twentyFourHoursAgo)
    .where("updatedAt", ">=", fortyEightHoursAgo)
    .get();

  console.log(`Encontrados ${projectsSnap.size} projetos abandonados recentes.`);

  let sentCount = 0;
  for (const doc of projectsSnap.docs) {
    const project = doc.data();

    // Evitar re-enviar se já foi enviado recentemente
    if (project.recoveryEmailSent) continue;

    // Buscar e-mail do usuário
    const userDoc = await db.collection("users").doc(project.uid).get();
    const userEmail = userDoc.exists ? (userDoc.data().email || userDoc.data().ownerEmail) : null;

    if (userEmail) {
      try {
        const recoverUrl = `https://sitezing.com.br?project=${doc.id}`;
        await transporter.sendMail({
          from: smtpConfig.from ? `"SiteZing" <${smtpConfig.from}>` : '"SiteZing" <suporte@sitezing.com.br>',
          to: userEmail,
          subject: `🚀 Quase lá! O seu site ${project.businessName || 'está esperando'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917;">
              <h2 style="color: #f97316;">Olá! Reparamos que você parou...</h2>
              <p>Notamos que você começou a criar o site do seu negócio <strong>${project.businessName || ''}</strong> na SiteZing, mas ele ainda não está no ar.</p>
              <p>Não deixe sua ideia esfriar! Ter um site profissional é o primeiro passo para conquistar mais clientes.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${recoverUrl}" style="background-color: #f97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Finalizar e Publicar meu Site</a>
              </div>
              <p style="font-size: 14px; color: #78716c;">O editor está exatamente como você deixou. Basta clicar e continuar!</p>
              <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 30px 0;" />
              <p style="font-size: 12px; color: #a8a29e; text-align: center;">SiteZing - Inteligência para o seu Negócio</p>
            </div>
          `
        });

        // Marcar como enviado no Firestore
        await doc.ref.update({
          recoveryEmailSent: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Registrar Log de Envio
        await db.collection("email_logs").add({
          recipient: userEmail,
          subject: `🚀 Quase lá! O seu site ${project.businessName || 'está esperando'}`,
          type: "recovery",
          status: "success",
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });

        sentCount++;
      } catch (err) {
        console.error(`Erro ao enviar recovery para ${userEmail}:`, err);
      }
    }
  }

  return { success: true, sentCount };
}

exports.listRecentEmailLogsAdmin = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito.");
  }
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const snap = await db.collection("email_logs")
      .where("sentAt", ">=", twentyFourHoursAgo)
      .orderBy("sentAt", "desc")
      .limit(50)
      .get();

    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { logs };
  } catch (err) {
    console.error("Erro ao listar logs de email:", err);
    throw new HttpsError("internal", err.message);
  }
});

/**
 * DESATIVADO POR SEGURANÇA (Prevenção de Spam/Suspensão)
 * 
exports.sendRecoveryEmails = onSchedule("every 24 hours", async (event) => {
  const db = admin.firestore();
  await processRecoveryCampaign(db);
});

exports.triggerRecoveryManual = onCall({ cors: true }, async (request) => {
  if (request.auth?.token?.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Acesso restrito.");
  }
  const db = admin.firestore();
  return await processRecoveryCampaign(db);
});
*/
