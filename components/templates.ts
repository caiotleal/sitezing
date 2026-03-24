export const TEMPLATES: Record<string, string> = {
  // ---------------------------------------------------------
  // 1. CENTRO IMPONENTE
  // ---------------------------------------------------------
  layout_modern_center: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{BUSINESS_NAME}}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; background-color: {{COLOR_1}}; color: {{COLOR_4}}; }
        .glass { background: {{COLOR_2}}; backdrop-filter: blur(10px); border: 1px solid {{COLOR_3}}; }
        
        /* HEADER GLASS NATIVO */
        .glass-header-premium { position: fixed; top: 0; left: 0; width: 100%; z-index: 9998; background: color-mix(in srgb, {{COLOR_2}} 85%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid color-mix(in srgb, {{COLOR_3}} 30%, transparent); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        
        .glass-container-premium { display: flex; align-items: center; max-width: 1200px; margin: 0 auto; padding: 12px 20px; gap: 10px; }
        .glass-container-premium.logo_left_icons_right { flex-direction: row; justify-content: space-between; }
        .glass-container-premium.logo_right_icons_left { flex-direction: row-reverse; justify-content: space-between; }
        .glass-container-premium.logo_center_icons_right { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_right .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_right .glass-actions-premium { grid-column: 3; justify-self: end; }
        .glass-container-premium.logo_center_icons_left { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_left .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_left .glass-actions-premium { grid-column: 1; justify-self: start; }

        .glass-logo-premium { display: flex; align-items: center; text-decoration: none; color: {{COLOR_4}}; font-weight: 900; font-size: 1.2rem; text-transform: uppercase; flex-shrink: 0; }
        .glass-logo-premium img { max-height: 36px; width: auto; display: block; }
        .glass-actions-premium { display: flex; align-items: center; gap: 15px; flex-wrap: nowrap; }
        .glass-social-links-premium { display: flex; gap: 12px; align-items: center; }
        .glass-social-link { font-size: 1.3rem; transition: transform 0.2s ease; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .glass-social-link:hover { transform: scale(1.15); opacity: 0.8; }
        .btn-contact-premium { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 25px; text-decoration: none; font-weight: 800; font-size: 0.85rem; transition: transform 0.2s ease; text-transform: uppercase; letter-spacing: 1px; background-color: {{COLOR_4}}; color: {{COLOR_1}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .btn-contact-premium:hover { transform: scale(1.05); opacity: 0.9; }
        
        @media (max-width: 768px) {
            .glass-container-premium { 
                display: flex !important; 
                flex-direction: column !important; 
                justify-content: center !important;
                align-items: center !important;
                padding: 10px !important;
                gap: 5px !important;
            }
            .glass-logo-premium { justify-content: center !important; margin-bottom: 2px !important; }
            .glass-actions-premium { justify-content: center !important; width: 100% !important; gap: 10px !important; }
            .glass-social-links-premium { gap: 10px !important; }
            .glass-social-link { font-size: 1.1rem !important; }
            .glass-logo-premium img { max-height: 28px !important; }
        }

      </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></head>
    <body class="antialiased flex flex-col min-h-screen">
      
      <header class="glass-header-premium" id="glassHeaderPremium">
          <div class="glass-container-premium [[HEADER_LAYOUT_CLASS]]">
              <a href="#" class="glass-logo-premium">[[LOGO_AREA]]</a>
              <div class="glass-actions-premium">
                  [[SOCIAL_LINKS_CONTAINER]]
                  
              </div>
          </div>
      </header>

      

      <section class="pt-40 pb-20 px-6 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-[{{COLOR_2}}] to-transparent opacity-50"></div>
        <div class="relative z-10 max-w-4xl w-full">
          <h1 class="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">{{HERO_TITLE}}</h1>
          <p class="text-xl md:text-2xl opacity-80 mb-10 font-light max-w-2xl mx-auto">{{HERO_SUBTITLE}}</p>
          <a href="#sobre" class="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105" style="background-color: {{COLOR_4}}; color: {{COLOR_1}};">
            Conheça mais <i class="fas fa-arrow-down"></i>
          </a>
          <div class="mt-16 w-full animate-fade-in-up">
            [[HERO_IMAGE]]
          </div>
        </div>
      </section>

      <section id="sobre" class="py-24 px-6 bg-[{{COLOR_2}}]">
        <div class="max-w-7xl mx-auto text-center">
          <h2 class="text-4xl font-black mb-8">{{ABOUT_TITLE}}</h2>
          <p class="text-lg opacity-80 leading-relaxed max-w-3xl mx-auto mb-12">{{ABOUT_TEXT}}</p>
          <div class="w-full max-w-5xl mx-auto">
            [[ABOUT_IMAGE]]
          </div>
        </div>
      </section>

      [[REVIEWS_AREA]]

      <section id="contato" class="py-24 px-6">
        <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 class="text-5xl font-black mb-6">Vamos conversar?</h2>
            <p class="text-xl opacity-80 mb-12">Estamos prontos para atender você. Entre em contato pelos canais abaixo ou nos faça uma visita.</p>
            <div class="space-y-6 text-lg">
              <div class="flex items-center gap-4"><div class="w-12 h-12 rounded-full flex items-center justify-center glass"><i class="fas fa-phone"></i></div> {{PHONE}}</div>
              <div class="flex items-center gap-4"><div class="w-12 h-12 rounded-full flex items-center justify-center glass"><i class="fas fa-envelope"></i></div> {{EMAIL}}</div>
              <div class="flex items-center gap-4"><div class="w-12 h-12 rounded-full flex items-center justify-center glass"><i class="fas fa-map-marker-alt"></i></div> {{ADDRESS}}</div>
            </div>
            [[MAP_AREA]]
          </div>
          <div class="glass p-8 md:p-12 rounded-[2rem]">
            [[CONTACT_FORM]]
          </div>
        </div>
      </section>

      
    </body>
    </html>
  `,

  // ---------------------------------------------------------
  // 2. SPLIT DINÂMICO
  // ---------------------------------------------------------
  layout_modern_split: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{BUSINESS_NAME}}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Space Grotesk', sans-serif; background-color: {{COLOR_1}}; color: {{COLOR_4}}; }
        
        .glass-header-premium { position: fixed; top: 0; left: 0; width: 100%; z-index: 9998; background: color-mix(in srgb, {{COLOR_2}} 85%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid color-mix(in srgb, {{COLOR_3}} 30%, transparent); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        
        .glass-container-premium { display: flex; align-items: center; max-width: 1200px; margin: 0 auto; padding: 12px 20px; gap: 10px; }
        .glass-container-premium.logo_left_icons_right { flex-direction: row; justify-content: space-between; }
        .glass-container-premium.logo_right_icons_left { flex-direction: row-reverse; justify-content: space-between; }
        .glass-container-premium.logo_center_icons_right { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_right .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_right .glass-actions-premium { grid-column: 3; justify-self: end; }
        .glass-container-premium.logo_center_icons_left { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_left .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_left .glass-actions-premium { grid-column: 1; justify-self: start; }

        .glass-logo-premium { display: flex; align-items: center; text-decoration: none; color: {{COLOR_4}}; font-weight: 900; font-size: 1.2rem; text-transform: uppercase; flex-shrink: 0; }
        .glass-logo-premium img { max-height: 36px; width: auto; display: block; }
        .glass-actions-premium { display: flex; align-items: center; gap: 15px; flex-wrap: nowrap; }
        .glass-social-links-premium { display: flex; gap: 12px; align-items: center; }
        .glass-social-link { font-size: 1.3rem; transition: transform 0.2s ease; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .glass-social-link:hover { transform: scale(1.15); opacity: 0.8; }
        .btn-contact-premium { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 25px; text-decoration: none; font-weight: 800; font-size: 0.85rem; transition: transform 0.2s ease; text-transform: uppercase; letter-spacing: 1px; background-color: {{COLOR_4}}; color: {{COLOR_1}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .btn-contact-premium:hover { transform: scale(1.05); opacity: 0.9; }
        
        @media (max-width: 768px) {
            .glass-container-premium { 
                display: flex !important; 
                flex-direction: column !important; 
                justify-content: center !important;
                align-items: center !important;
                padding: 10px !important;
                gap: 5px !important;
            }
            .glass-logo-premium { justify-content: center !important; margin-bottom: 2px !important; }
            .glass-actions-premium { justify-content: center !important; width: 100% !important; gap: 10px !important; }
            .glass-social-links-premium { gap: 10px !important; }
            .glass-social-link { font-size: 1.1rem !important; }
            .glass-logo-premium img { max-height: 28px !important; }
        }

      </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></head>
    <body class="antialiased flex flex-col min-h-screen">
      
      <header class="glass-header-premium" id="glassHeaderPremium">
          <div class="glass-container-premium [[HEADER_LAYOUT_CLASS]]">
              <a href="#" class="glass-logo-premium">[[LOGO_AREA]]</a>
              <div class="glass-actions-premium">
                  [[SOCIAL_LINKS_CONTAINER]]
                  
              </div>
          </div>
      </header>

      

      <section class="pt-32 pb-20 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row items-center gap-12">
        <div class="flex-1 w-full text-center md:text-left">
          <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">{{HERO_TITLE}}</h1>
          <p class="text-xl opacity-70 mb-8 max-w-lg mx-auto md:mx-0">{{HERO_SUBTITLE}}</p>
          <a href="#sobre" class="inline-block px-8 py-4 bg-[{{COLOR_4}}] text-[{{COLOR_1}}] font-bold rounded-lg hover:scale-105 transition-transform">Saber mais</a>
        </div>
        <div class="flex-1 w-full">
          [[HERO_IMAGE]]
        </div>
      </section>

      <section id="sobre" class="py-24 px-6 bg-[{{COLOR_2}}]">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div class="flex-1 w-full order-2 md:order-1">
            [[ABOUT_IMAGE]]
          </div>
          <div class="flex-1 w-full order-1 md:order-2 text-center md:text-left">
            <h2 class="text-4xl font-bold mb-6">{{ABOUT_TITLE}}</h2>
            <p class="text-lg opacity-80 leading-relaxed">{{ABOUT_TEXT}}</p>
          </div>
        </div>
      </section>

      [[REVIEWS_AREA]]

      <section id="contato" class="py-24 px-6 max-w-7xl mx-auto w-full text-center">
        <h2 class="text-4xl font-bold mb-16">Fale Conosco</h2>
        <div class="grid md:grid-cols-3 gap-8 mb-16">
          <div class="p-8 bg-[{{COLOR_2}}] rounded-2xl border border-[{{COLOR_3}}]"><i class="fas fa-phone text-3xl mb-4 text-[{{COLOR_5}}]"></i><div class="font-bold">{{PHONE}}</div></div>
          <div class="p-8 bg-[{{COLOR_2}}] rounded-2xl border border-[{{COLOR_3}}]"><i class="fas fa-envelope text-3xl mb-4 text-[{{COLOR_5}}]"></i><div class="font-bold break-words">{{EMAIL}}</div></div>
          <div class="p-8 bg-[{{COLOR_2}}] rounded-2xl border border-[{{COLOR_3}}]"><i class="fas fa-map-marker-alt text-3xl mb-4 text-[{{COLOR_5}}]"></i><div class="font-bold">{{ADDRESS}}</div></div>
        </div>
        <div class="max-w-3xl mx-auto text-left">
          [[CONTACT_FORM]]
        </div>
        [[MAP_AREA]]
      </section>

      
    </body>
    </html>
  `,

  // ---------------------------------------------------------
  // 3. GRID EM VIDRO
  // ---------------------------------------------------------
  layout_glass_grid: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{BUSINESS_NAME}}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Outfit', sans-serif; background-color: {{COLOR_1}}; color: {{COLOR_4}}; }
        .glass-panel { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 2rem; backdrop-filter: blur(20px); }
        
        .glass-header-premium { position: fixed; top: 0; left: 0; width: 100%; z-index: 9998; background: color-mix(in srgb, {{COLOR_2}} 85%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid color-mix(in srgb, {{COLOR_3}} 30%, transparent); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        
        .glass-container-premium { display: flex; align-items: center; max-width: 1200px; margin: 0 auto; padding: 12px 20px; gap: 10px; }
        .glass-container-premium.logo_left_icons_right { flex-direction: row; justify-content: space-between; }
        .glass-container-premium.logo_right_icons_left { flex-direction: row-reverse; justify-content: space-between; }
        .glass-container-premium.logo_center_icons_right { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_right .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_right .glass-actions-premium { grid-column: 3; justify-self: end; }
        .glass-container-premium.logo_center_icons_left { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_left .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_left .glass-actions-premium { grid-column: 1; justify-self: start; }

        .glass-logo-premium { display: flex; align-items: center; text-decoration: none; color: {{COLOR_4}}; font-weight: 900; font-size: 1.2rem; text-transform: uppercase; flex-shrink: 0; }
        .glass-logo-premium img { max-height: 36px; width: auto; display: block; }
        .glass-actions-premium { display: flex; align-items: center; gap: 15px; flex-wrap: nowrap; }
        .glass-social-links-premium { display: flex; gap: 12px; align-items: center; }
        .glass-social-link { font-size: 1.3rem; transition: transform 0.2s ease; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .glass-social-link:hover { transform: scale(1.15); opacity: 0.8; }
        .btn-contact-premium { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 25px; text-decoration: none; font-weight: 800; font-size: 0.85rem; transition: transform 0.2s ease; text-transform: uppercase; letter-spacing: 1px; background-color: {{COLOR_4}}; color: {{COLOR_1}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .btn-contact-premium:hover { transform: scale(1.05); opacity: 0.9; }
        
        @media (max-width: 768px) {
            .glass-container-premium { 
                display: flex !important; 
                flex-direction: column !important; 
                justify-content: center !important;
                align-items: center !important;
                padding: 10px !important;
                gap: 5px !important;
            }
            .glass-logo-premium { justify-content: center !important; margin-bottom: 2px !important; }
            .glass-actions-premium { justify-content: center !important; width: 100% !important; gap: 10px !important; }
            .glass-social-links-premium { gap: 10px !important; }
            .glass-social-link { font-size: 1.1rem !important; }
            .glass-logo-premium img { max-height: 28px !important; }
        }

      </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></head>
    <body class="antialiased p-4 md:p-8 min-h-screen flex flex-col relative">
      
      <header class="glass-header-premium" id="glassHeaderPremium">
          <div class="glass-container-premium [[HEADER_LAYOUT_CLASS]]">
              <a href="#" class="glass-logo-premium">[[LOGO_AREA]]</a>
              <div class="glass-actions-premium">
                  [[SOCIAL_LINKS_CONTAINER]]
                  
              </div>
          </div>
      </header>

      <div class="fixed top-0 left-0 w-96 h-96 bg-[{{COLOR_5}}] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 z-0"></div>
      <div class="fixed bottom-0 right-0 w-96 h-96 bg-[{{COLOR_7}}] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 z-0"></div>

      <div class="max-w-7xl mx-auto w-full z-10 flex-1 flex flex-col gap-6 pt-32">
        
        <div class="grid md:grid-cols-3 gap-6">
          
          
          <div class="glass-panel p-10 md:col-span-2 flex flex-col justify-center">
            <h1 class="text-4xl md:text-6xl font-extrabold mb-4">{{HERO_TITLE}}</h1>
            <p class="text-xl opacity-70">{{HERO_SUBTITLE}}</p>
          </div>
          
          <div class="glass-panel p-6 flex items-center justify-center min-h-[300px]">
             <div class="w-full">[[HERO_IMAGE]]</div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
           <div class="glass-panel p-6 flex items-center justify-center min-h-[300px]">
             <div class="w-full">[[ABOUT_IMAGE]]</div>
          </div>
          <div class="glass-panel p-10 flex flex-col justify-center">
            <h2 class="text-3xl font-bold mb-4">{{ABOUT_TITLE}}</h2>
            <p class="text-lg opacity-80 leading-relaxed">{{ABOUT_TEXT}}</p>
          </div>
        </div>

        [[REVIEWS_AREA]]

        <div id="contato" class="glass-panel p-10">
          <h2 class="text-3xl font-bold mb-8 text-center border-b border-white/10 pb-6">Contato & Localização</h2>
          <div class="grid md:grid-cols-2 gap-12">
            <div>
              <div class="space-y-6 mb-8 text-lg">
                <p><strong class="block text-sm text-[{{COLOR_5}}] uppercase tracking-wider mb-1">Telefone</strong> {{PHONE}}</p>
                <p><strong class="block text-sm text-[{{COLOR_5}}] uppercase tracking-wider mb-1">E-mail</strong> {{EMAIL}}</p>
                <p><strong class="block text-sm text-[{{COLOR_5}}] uppercase tracking-wider mb-1">Endereço</strong> {{ADDRESS}}</p>
              </div>
              [[MAP_AREA]]
            </div>
            <div>
              [[CONTACT_FORM]]
            </div>
          </div>
        </div>

      </div>

      
    </body>
    </html>
  `,

  // ---------------------------------------------------------
  // 4. ELEGÂNCIA MINIMALISTA
  // ---------------------------------------------------------
  layout_minimal_elegance: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{BUSINESS_NAME}}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Lato', sans-serif; background-color: {{COLOR_1}}; color: {{COLOR_4}}; }
        h1, h2, h3, .logo-text { font-family: 'Playfair Display', serif; }
        
        .glass-header-premium { position: fixed; top: 0; left: 0; width: 100%; z-index: 9998; background: color-mix(in srgb, {{COLOR_2}} 85%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid color-mix(in srgb, {{COLOR_3}} 30%, transparent); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        
        .glass-container-premium { display: flex; align-items: center; max-width: 1200px; margin: 0 auto; padding: 12px 20px; gap: 10px; }
        .glass-container-premium.logo_left_icons_right { flex-direction: row; justify-content: space-between; }
        .glass-container-premium.logo_right_icons_left { flex-direction: row-reverse; justify-content: space-between; }
        .glass-container-premium.logo_center_icons_right { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_right .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_right .glass-actions-premium { grid-column: 3; justify-self: end; }
        .glass-container-premium.logo_center_icons_left { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_left .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_left .glass-actions-premium { grid-column: 1; justify-self: start; }

        .glass-logo-premium { display: flex; align-items: center; text-decoration: none; color: {{COLOR_4}}; font-weight: 900; font-size: 1.2rem; text-transform: uppercase; flex-shrink: 0; }
        .glass-logo-premium img { max-height: 36px; width: auto; display: block; }
        .glass-actions-premium { display: flex; align-items: center; gap: 15px; flex-wrap: nowrap; }
        .glass-social-links-premium { display: flex; gap: 12px; align-items: center; }
        .glass-social-link { font-size: 1.3rem; transition: transform 0.2s ease; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .glass-social-link:hover { transform: scale(1.15); opacity: 0.8; }
        .btn-contact-premium { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 25px; text-decoration: none; font-weight: 800; font-size: 0.85rem; transition: transform 0.2s ease; text-transform: uppercase; letter-spacing: 1px; background-color: {{COLOR_4}}; color: {{COLOR_1}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .btn-contact-premium:hover { transform: scale(1.05); opacity: 0.9; }
        
        @media (max-width: 768px) {
            .glass-container-premium { 
                display: flex !important; 
                flex-direction: column !important; 
                justify-content: center !important;
                align-items: center !important;
                padding: 10px !important;
                gap: 5px !important;
            }
            .glass-logo-premium { justify-content: center !important; margin-bottom: 2px !important; }
            .glass-actions-premium { justify-content: center !important; width: 100% !important; gap: 10px !important; }
            .glass-social-links-premium { gap: 10px !important; }
            .glass-social-link { font-size: 1.1rem !important; }
            .glass-logo-premium img { max-height: 28px !important; }
        }

      </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></head>
    <body class="antialiased flex flex-col min-h-screen">
      
      <header class="glass-header-premium" id="glassHeaderPremium">
          <div class="glass-container-premium [[HEADER_LAYOUT_CLASS]]">
              <a href="#" class="glass-logo-premium">[[LOGO_AREA]]</a>
              <div class="glass-actions-premium">
                  [[SOCIAL_LINKS_CONTAINER]]
                  
              </div>
          </div>
      </header>

      

      <main class="flex-1 max-w-4xl mx-auto w-full px-6">
        
        <section class="pt-40 pb-24 text-center">
          <h1 class="text-5xl md:text-7xl mb-6">{{HERO_TITLE}}</h1>
          <p class="text-xl uppercase tracking-widest opacity-60 mb-12">{{HERO_SUBTITLE}}</p>
          <div class="w-full mb-12">[[HERO_IMAGE]]</div>
        </section>

        <div class="w-24 h-px bg-[{{COLOR_3}}] mx-auto my-12"></div>

        <section class="py-24 text-center">
          <h2 class="text-4xl mb-8 italic">{{ABOUT_TITLE}}</h2>
          <p class="text-lg leading-loose opacity-80 mb-12">{{ABOUT_TEXT}}</p>
          <div class="w-full">[[ABOUT_IMAGE]]</div>
        </section>

        <div class="w-24 h-px bg-[{{COLOR_3}}] mx-auto my-12"></div>

        [[REVIEWS_AREA]]

        <section id="contato" class="py-24 text-center">
          <h2 class="text-4xl mb-16">Contato</h2>
          <div class="flex flex-col md:flex-row justify-center gap-12 text-lg mb-16">
            <div><span class="block text-sm uppercase opacity-50 mb-2">Telefone</span> {{PHONE}}</div>
            <div><span class="block text-sm uppercase opacity-50 mb-2">E-mail</span> {{EMAIL}}</div>
            <div><span class="block text-sm uppercase opacity-50 mb-2">Endereço</span> {{ADDRESS}}</div>
          </div>
          <div class="max-w-2xl mx-auto text-left mb-16">
            [[CONTACT_FORM]]
          </div>
          <div class="max-w-3xl mx-auto">
            [[MAP_AREA]]
          </div>
        </section>

      </main>
      <footer class="text-center py-8 border-t border-[{{COLOR_3}}] opacity-50 text-sm uppercase tracking-widest">
        © {{BUSINESS_NAME}}
      </footer>

      
    </body>
    </html>
  `,

  // ---------------------------------------------------------
  // 5. FLUXO CONTÍNUO
  // ---------------------------------------------------------
  layout_dynamic_flow: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{BUSINESS_NAME}}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Montserrat', sans-serif; background-color: {{COLOR_1}}; color: {{COLOR_4}}; overflow-x: hidden; }
        .section-curve { border-bottom-left-radius: 5rem; border-bottom-right-radius: 5rem; }
        
        .glass-header-premium { position: fixed; top: 0; left: 0; width: 100%; z-index: 9998; background: color-mix(in srgb, {{COLOR_2}} 85%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid color-mix(in srgb, {{COLOR_3}} 30%, transparent); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        
        .glass-container-premium { display: flex; align-items: center; max-width: 1200px; margin: 0 auto; padding: 12px 20px; gap: 10px; }
        .glass-container-premium.logo_left_icons_right { flex-direction: row; justify-content: space-between; }
        .glass-container-premium.logo_right_icons_left { flex-direction: row-reverse; justify-content: space-between; }
        .glass-container-premium.logo_center_icons_right { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_right .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_right .glass-actions-premium { grid-column: 3; justify-self: end; }
        .glass-container-premium.logo_center_icons_left { display: grid; grid-template-columns: 1fr auto 1fr; justify-content: stretch; }
        .glass-container-premium.logo_center_icons_left .glass-logo-premium { grid-column: 2; justify-self: center; }
        .glass-container-premium.logo_center_icons_left .glass-actions-premium { grid-column: 1; justify-self: start; }

        .glass-logo-premium { display: flex; align-items: center; text-decoration: none; color: {{COLOR_4}}; font-weight: 900; font-size: 1.2rem; text-transform: uppercase; flex-shrink: 0; }
        .glass-logo-premium img { max-height: 36px; width: auto; display: block; }
        .glass-actions-premium { display: flex; align-items: center; gap: 15px; flex-wrap: nowrap; }
        .glass-social-links-premium { display: flex; gap: 12px; align-items: center; }
        .glass-social-link { font-size: 1.3rem; transition: transform 0.2s ease; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .glass-social-link:hover { transform: scale(1.15); opacity: 0.8; }
        .btn-contact-premium { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; padding: 0; border-radius: 25px; text-decoration: none; font-weight: 800; font-size: 0.85rem; transition: transform 0.2s ease; text-transform: uppercase; letter-spacing: 1px; background-color: {{COLOR_4}}; color: {{COLOR_1}}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .btn-contact-premium:hover { transform: scale(1.05); opacity: 0.9; }
        
        @media (max-width: 768px) {
            .glass-container-premium { 
                display: flex !important; 
                flex-direction: column !important; 
                justify-content: center !important;
                align-items: center !important;
                padding: 10px !important;
                gap: 5px !important;
            }
            .glass-logo-premium { justify-content: center !important; margin-bottom: 2px !important; }
            .glass-actions-premium { justify-content: center !important; width: 100% !important; gap: 10px !important; }
            .glass-social-links-premium { gap: 10px !important; }
            .glass-social-link { font-size: 1.1rem !important; }
            .glass-logo-premium img { max-height: 28px !important; }
        }

      </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></head>
    <body class="antialiased">
      
      <header class="glass-header-premium" id="glassHeaderPremium">
          <div class="glass-container-premium [[HEADER_LAYOUT_CLASS]]">
              <a href="#" class="glass-logo-premium">[[LOGO_AREA]]</a>
              <div class="glass-actions-premium">
                  [[SOCIAL_LINKS_CONTAINER]]
                  
              </div>
          </div>
      </header>

      <section class="bg-[{{COLOR_2}}] section-curve pt-32 pb-32 px-6 relative z-20 shadow-2xl">
        
        
        <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 class="text-5xl md:text-7xl font-black mb-6 leading-none">{{HERO_TITLE}}</h1>
            <p class="text-xl md:text-2xl opacity-80 font-medium">{{HERO_SUBTITLE}}</p>
          </div>
          <div class="w-full">[[HERO_IMAGE]]</div>
        </div>
      </section>

      <section class="pt-32 pb-32 px-6 relative z-10 -mt-16">
        <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
           <div class="order-2 md:order-1 w-full">[[ABOUT_IMAGE]]</div>
          <div class="order-1 md:order-2 text-right">
            <h2 class="text-4xl md:text-5xl font-black mb-6 text-[{{COLOR_5}}]">{{ABOUT_TITLE}}</h2>
            <p class="text-lg opacity-80 leading-relaxed font-medium">{{ABOUT_TEXT}}</p>
          </div>
        </div>
      </section>

      [[REVIEWS_AREA]]

      <section id="contato" class="bg-[{{COLOR_2}}] rounded-t-[5rem] pt-32 pb-24 px-6 relative z-20">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-black mb-4">Informações de Contato</h2>
            <div class="w-20 h-2 bg-[{{COLOR_5}}] mx-auto rounded-full"></div>
          </div>
          
          <div class="grid md:grid-cols-3 gap-8 mb-16 text-center">
            <div><div class="w-16 h-16 mx-auto bg-[{{COLOR_1}}] rounded-full flex items-center justify-center text-2xl text-[{{COLOR_5}}] mb-4 shadow-lg"><i class="fas fa-phone"></i></div><p class="font-bold">{{PHONE}}</p></div>
            <div><div class="w-16 h-16 mx-auto bg-[{{COLOR_1}}] rounded-full flex items-center justify-center text-2xl text-[{{COLOR_5}}] mb-4 shadow-lg"><i class="fas fa-envelope"></i></div><p class="font-bold break-words">{{EMAIL}}</p></div>
            <div><div class="w-16 h-16 mx-auto bg-[{{COLOR_1}}] rounded-full flex items-center justify-center text-2xl text-[{{COLOR_5}}] mb-4 shadow-lg"><i class="fas fa-map-marker-alt"></i></div><p class="font-bold">{{ADDRESS}}</p></div>
          </div>

          <div class="grid md:grid-cols-2 gap-12 bg-[{{COLOR_1}}] p-8 md:p-12 rounded-3xl shadow-xl">
            <div>[[CONTACT_FORM]]</div>
            <div>[[MAP_AREA]]</div>
          </div>
        </div>
      </section>

      
    </body>
    </html>
  `
};
