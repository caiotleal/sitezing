// A CLOUD FUNCTION QUE INTERCEPTA E RENDERIZA TODOS OS SITES DO MUNDO
exports.servesite = onRequest({ cors: true, timeoutSeconds: 15, memory: "256MiB" }, async (req, res) => {
  try {
    const host = req.hostname.replace(/^www\./, '').toLowerCase();
    const db = admin.firestore();
    let projectSnap;

    // 1. Domínio da plataforma (ex: eletricista.sitezing.com.br)
    if (host.endsWith('sitezing.com.br')) {
      const slug = host.split('.')[0]; 
      
      // Proteção: Se acessarem apenas "sitezing.com.br" ou "www", não tenta buscar slug
      if (!slug || slug === 'sitezing' || slug === 'www') {
        return res.status(200).send("<h1>SiteZing Master Roteador Ativo 🚀</h1>");
      }
      
      // Busca o projeto pelo projectSlug (que é o nome do subdomínio)
      projectSnap = await db.collectionGroup("projects").where("projectSlug", "==", slug).limit(1).get();
    } 
    // 2. URL Fallback do Firebase (ex: roteador.web.app/eletricista)
    else if (host.includes('web.app') || host.includes('firebaseapp.com')) {
      // O slug está no caminho (path), ex: /eletricista-1234
      const slug = req.path.split('/')[1]; 
      
      if (!slug) {
         return res.status(200).send("<h1>SiteZing Cloud Roteador Ativo 🚀</h1>");
      }

      projectSnap = await db.collectionGroup("projects").where("projectSlug", "==", slug).limit(1).get();
    } 
    // 3. Domínio Customizado do Cliente (ex: casacaiu.com.br)
    else {
      projectSnap = await db.collectionGroup("projects").where("officialDomain", "==", host).limit(1).get();
    }

    if (!projectSnap || projectSnap.empty) {
      return res.status(404).send(`
        <html>
          <body style='text-align:center; padding:50px; font-family:sans-serif;'>
            <h1>404 - Site não encontrado</h1>
            <p>O site que você está procurando não existe ou o endereço está incorreto.</p>
          </body>
        </html>
      `);
    }

    const project = projectSnap.docs[0].data();

    // Trava de congelamento do site (Falha de Pagamento/Vencimento)
    if (project.status === "frozen") {
      return res.status(403).send(`
        <html>
          <body style='text-align:center; padding:50px; font-family:sans-serif; background:#FFF7ED; color:#9A3412;'>
            <h1>Site Temporariamente Inativo</h1>
            <p>O administrador deste site precisa renovar o plano para restaurar o acesso.</p>
          </body>
        </html>
      `);
    }

    // Sucesso Absoluto: Envia o HTML renderizado do Banco
    res.status(200).send(project.generatedHtml);
  } catch (error) {
    console.error("Router error:", error);
    res.status(500).send(`Erro interno no Roteador: ${error.message}`);
  }
});
