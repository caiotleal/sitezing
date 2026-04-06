const admin = require("firebase-admin");

/**
 * DATABASE SEEDER FOR SITEZING
 * Este script inicializa a estrutura básica do Firestore.
 * 
 * INSTRUÇÕES:
 * 1. Baixe o arquivo 'service-account.json' no Google Cloud Console:
 *    IAM & Admin > Service Accounts > firebase-adminsdk > Keys > Add Key > Create new key (JSON)
 * 2. Renomeie o arquivo para 'service-account.json' e coloque na raiz do projeto.
 * 3. Rode: node init_database.js
 */

const serviceAccount = require("./service-account.json.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "sitezing-4714c"
});

const db = admin.firestore();

async function seed() {
  console.log("🚀 Iniciando 'montagem' do banco de dados...");

  const platformConfig = {
    pricing: {
      mensal: 49.90,
      anual: 499.00
    },
    marketing: {
      bannerActive: false,
      bannerText: "Aproveite nossa promoção de lançamento!",
      bannerType: "info",
      couponCode: "SITEZING10"
    },
    stripe: {
      mode: "test",
      testPublicKey: "pk_test_SUBSTITUA_PELA_SUA_CHAVE_PUBLICA",
      testSecretKey: "sk_test_SUBSTITUA_PELA_SUA_CHAVE_PRIVADA",
      testWebhookSecret: "whsec_SUBSTITUA_PELO_WEBHOOK_SECRET",
      prodPublicKey: "",
      prodSecretKey: "",
      prodWebhookSecret: ""
    },
    plans: [
      {
        id: "prod_standard",
        priceId: "price_123_mensal_placeholder",
        name: "Plano Mensal",
        description: "Ideal para começar",
        price: 49.90,
        interval: "month",
        features: ["Site Exclusivo", "Suporte 24/7", "Domínio SiteZing"],
        sortOrder: 1,
        active: true
      },
      {
        id: "prod_premium",
        priceId: "price_123_anual_placeholder",
        name: "Plano Anual",
        description: "Melhor custo-benefício",
        price: 499.00,
        interval: "year",
        features: ["Site Exclusivo", "Suporte Priority", "Domínio Grátis por 1 ano"],
        sortOrder: 2,
        active: true,
        badge: "Mais Popular"
      }
    ],
    legal: {
      termsOfUse: "Termos de uso padrão da plataforma SiteZing...",
      privacyPolicy: "Política de privacidade padrão..."
    },
    reviews: [], // Array vazio para as avaliações no CPanel
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("configs").doc("platform").set(platformConfig, { merge: true });
    console.log("✅ Documento 'configs/platform' criado com sucesso!");
    
    // Opcional: Criar um primeiro ticket de suporte de teste
    await db.collection("support_tickets").add({
      subject: "Bem-vindo ao SiteZing!",
      message: "Este é um ticket de teste para verificar se o seu sistema de suporte está funcionando.",
      email: "suporte@sitezing.com.br",
      name: "Equipe SiteZing",
      status: "open",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ Ticket de teste criado.");

    console.log("\n🔥 BANCO DE DADOS PRONTO!");
    console.log("Agora você pode acessar o CPanel e configurar as chaves do Stripe reais.");
    
  } catch (error) {
    console.error("❌ Erro ao 'montar' o banco:", error);
  }
}

seed();
