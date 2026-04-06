// Arquivo: src/components/templates.ts

export const TEMPLATES = {
  default: `
    <div class="template-default">
      <header class="p-6 flex justify-between items-center bg-white border-b">
        [[LOGO_AREA]]
        <nav class="space-x-4">
          <a href="#sobre" class="text-gray-600 hover:text-gray-900 transition-colors">Sobre</a>
          <a href="#contato" class="text-gray-600 hover:text-gray-900 transition-colors">Contato</a>
        </nav>
      </header>

      <main>
        <section class="py-20 px-6 max-w-6xl mx-auto text-center">
          <h1 class="text-5xl font-bold mb-6 text-gray-900 tracking-tight">{{HERO_TITLE}}</h1>
          <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">{{HERO_SUBTITLE}}</p>
          <a href="#contato" class="inline-block px-8 py-4 bg-primary text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105" style="background-color: {{COLOR_7}}">Conheça mais</a>
        </section>

        <section id="sobre" class="py-20 px-6 bg-gray-50">
          <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold mb-12 text-center text-gray-900">{{ABOUT_TITLE}}</h2>
            <div class="prose prose-lg max-w-none text-gray-600 leading-relaxed shadow-sm p-8 bg-white rounded-xl">
              {{ABOUT_TEXT}}
            </div>
          </div>
        </section>

        <section id="contato" class="py-20 px-6">
          <div class="max-w-xl mx-auto text-center">
            <h2 class="text-3xl font-bold mb-8 text-gray-900">Vamos conversar?</h2>
            <p class="text-gray-600 mb-12">Estamos prontos para atender você. Entre em contato pelos canais abaixo ou nos faça uma visita.</p>
            <div class="space-y-6 text-lg">
              <p class="flex items-center justify-center space-x-3 text-gray-700">
                <span class="font-semibold">Telefone:</span>
                <span>{{PHONE}}</span>
              </p>
              <p class="flex items-center justify-center space-x-3 text-gray-700">
                <span class="font-semibold">E-mail:</span>
                <span>{{EMAIL}}</span>
              </p>
              <p class="flex items-center justify-center space-x-3 text-gray-700">
                <span class="font-semibold">Endereço:</span>
                <span>{{ADDRESS}}</span>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer class="py-12 px-6 bg-white border-t">
        <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 text-gray-500 text-sm">
          [[LOGO_AREA]]
          <p>© ${new Date().getFullYear()} {{BUSINESS_NAME}}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  `,
  layout_modern_center: `
    <div class="template-layout-modern-center" style="background-color: {{COLOR_1}}; color: {{COLOR_4}}">
      <header class="p-6 flex justify-between items-center border-b border-opacity-10" style="border-color: {{COLOR_3}}">
        [[LOGO_AREA]]
        <div class="flex items-center gap-6">
          <nav class="hidden md:flex items-center gap-6">
            <a href="#sobre" class="hover:opacity-70 transition-opacity">Sobre</a>
            <a href="#contato" class="hover:opacity-70 transition-opacity">Contato</a>
          </nav>
          [[SOCIAL_LINKS_CONTAINER]]
        </div>
      </header>

      <main>
        <section class="py-32 px-6 text-center">
          <div class="max-w-4xl mx-auto">
            <h1 class="text-6xl md:text-8xl font-black mb-8 leading-tight animate-fade-up">{{HERO_TITLE}}</h1>
            <p class="text-xl md:text-2xl opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed">{{HERO_SUBTITLE}}</p>
            <a href="#contato" class="inline-block px-10 py-5 rounded-full font-bold text-lg shadow-2xl transition-all transform hover:scale-105 active:scale-95" style="background-color: {{COLOR_7}}; color: {{COLOR_1}}">{{CONTACT_CALL}}</a>
          </div>
        </section>

        <section id="sobre" class="py-24 px-6" style="background-color: {{COLOR_2}}">
          <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div class="aspect-video rounded-3xl overflow-hidden shadow-2xl">
              [[ABOUT_IMAGE]]
            </div>
            <div>
              <h2 class="text-4xl font-black mb-8">{{ABOUT_TITLE}}</h2>
              <div class="text-lg leading-relaxed opacity-90">{{ABOUT_TEXT}}</div>
            </div>
          </div>
        </section>

        [[REVIEWS_AREA]]

        <section id="contato" class="py-24 px-6">
          <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-4xl font-black mb-12">Entre em Contato</h2>
            <div class="grid md:grid-cols-3 gap-8 mb-16">
              <div class="p-8 rounded-3xl" style="background-color: {{COLOR_3}}">
                <i class="fas fa-phone-alt text-2xl mb-4" style="color: {{COLOR_7}}"></i>
                <h4 class="font-bold mb-2">Telefone</h4>
                <p class="opacity-80">{{PHONE}}</p>
              </div>
              <div class="p-8 rounded-3xl" style="background-color: {{COLOR_3}}">
                <i class="fas fa-envelope text-2xl mb-4" style="color: {{COLOR_7}}"></i>
                <h4 class="font-bold mb-2">Email</h4>
                <p class="opacity-80">{{EMAIL}}</p>
              </div>
              <div class="p-8 rounded-3xl" style="background-color: {{COLOR_3}}">
                <i class="fas fa-map-marker-alt text-2xl mb-4" style="color: {{COLOR_7}}"></i>
                <h4 class="font-bold mb-2">Localização</h4>
                <p class="opacity-80">{{ADDRESS}}</p>
              </div>
            </div>
            [[MAP_AREA]]
          </div>
        </section>
      </main>

      <footer class="py-12 px-6 border-t border-opacity-10" style="border-color: {{COLOR_3}}">
        <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          [[LOGO_AREA]]
          <p class="opacity-50 tracking-wider">© ${new Date().getFullYear()} {{BUSINESS_NAME}}</p>
          [[SOCIAL_LINKS_CONTAINER]]
        </div>
      </footer>
    </div>
    <style>
      @keyframes fade-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-up { animation: fade-up 1s ease-out forwards; }
    </style>
  `,
  layout_modern_split: `
    <div class="template-layout-modern-split" style="background-color: {{COLOR_LIGHT}}; color: {{COLOR_DARK}}">
      <header class="p-6 flex justify-between items-center sticky top-0 bg-white bg-opacity-90 backdrop-blur-md z-50">
        [[LOGO_AREA]]
        <nav class="flex items-center gap-8">
          <a href="#sobre" class="font-bold hover:text-{{COLOR_7}} transition-colors">História</a>
          <a href="#contato" class="font-bold hover:text-{{COLOR_7}} transition-colors">Falar Agora</a>
        </nav>
      </header>

      <main>
        <section class="min-h-screen flex flex-col md:flex-row">
          <div class="md:w-1/2 p-12 md:p-24 flex flex-col justify-center order-2 md:order-1">
            <h1 class="text-5xl md:text-7xl font-black mb-8 leading-tight">{{HERO_TITLE}}</h1>
            <p class="text-xl opacity-70 mb-12 leading-relaxed">{{HERO_SUBTITLE}}</p>
            <div>
              <a href="#contato" class="inline-block px-12 py-5 rounded-xl font-bold text-lg shadow-lg transition-transform hover:-translate-y-1" style="background-color: {{COLOR_7}}; color: white">Começar Jornada</a>
            </div>
          </div>
          <div class="md:w-1/2 order-1 md:order-2">
            [[HERO_IMAGE]]
          </div>
        </section>

        <section id="sobre" class="py-32 px-6">
          <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-20">
            <div class="md:w-1/2">
              <h2 class="text-4xl font-black mb-10 italic border-l-8 pl-8" style="border-color: {{COLOR_7}}">O que nos move</h2>
              <div class="text-lg opacity-80 leading-loose">{{ABOUT_TEXT}}</div>
            </div>
            <div class="md:w-1/2 relative">
               <div class="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-20" style="background-color: {{COLOR_7}}"></div>
               [[ABOUT_IMAGE]]
            </div>
          </div>
        </section>

        [[REVIEWS_AREA]]

        <section id="contato" class="py-32 text-white" style="background-color: {{COLOR_DARK}}">
          <div class="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-20">
            <div>
              <h2 class="text-5xl font-black mb-8">Vamos Criar<br/>Algo Novo?</h2>
              <p class="text-lg opacity-70 mb-12">Estamos ansiosos para ouvir sua idéia e transformar em realidade.</p>
              <div class="space-y-6">
                <div class="flex items-center gap-4">
                  <span class="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-10"><i class="fab fa-whatsapp"></i></span>
                  <span>{{PHONE}}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-10"><i class="fas fa-map-pin"></i></span>
                  <span>{{ADDRESS}}</span>
                </div>
              </div>
            </div>
            <div class="bg-white p-10 rounded-[2rem]">
              [[MAP_AREA]]
            </div>
          </div>
        </section>
      </main>

      <footer class="py-12 px-6 bg-white flex flex-col md:flex-row justify-between items-center gap-4 border-t">
        [[LOGO_AREA]]
        <div class="flex gap-4">[[SOCIAL_LINKS]]</div>
        <p class="font-bold opacity-30 text-sm">© ${new Date().getFullYear()} {{BUSINESS_NAME}}</p>
      </footer>
    </div>
  `,
  layout_glass_grid: `
    <div class="template-layout-glass-grid" style="background-color: {{COLOR_1}}; color: {{COLOR_4}}; font-family: 'Inter', sans-serif;">
      <header class="p-8 flex justify-between items-center sticky top-0 z-50">
        <div class="backdrop-blur-xl bg-white bg-opacity-5 border border-white border-opacity-10 px-8 py-3 rounded-full flex items-center gap-8 shadow-2xl">
          [[LOGO_AREA]]
          <nav class="hidden md:flex items-center gap-8 text-sm font-medium tracking-widest uppercase">
            <a href="#sobre" class="hover:text-{{COLOR_7}} transition-colors">Negócio</a>
            <a href="#contato" class="hover:text-{{COLOR_7}} transition-colors">Falar</a>
          </nav>
        </div>
        [[SOCIAL_LINKS_CONTAINER]]
      </header>

      <main class="max-w-7xl mx-auto px-6 py-12">
        <div class="grid md:grid-cols-12 gap-8">
          <!-- Hero Section -->
          <div class="md:col-span-8 p-12 md:p-24 rounded-[3rem] shadow-inner border border-white border-opacity-5 flex flex-col justify-center relative overflow-hidden" style="background-color: {{COLOR_2}}">
            <div class="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-20 rounded-full" style="background-color: {{COLOR_7}}"></div>
            <h1 class="text-6xl md:text-7xl font-black mb-8 leading-tight relative z-10">{{HERO_TITLE}}</h1>
            <p class="text-xl md:text-2xl opacity-60 mb-12 max-w-xl leading-relaxed relative z-10">{{HERO_SUBTITLE}}</p>
            <div class="relative z-10">
              <a href="#contato" class="inline-flex items-center gap-4 px-12 py-5 rounded-full font-black text-lg transition-all hover:bg-white hover:text-black hover:scale-105" style="background-color: {{COLOR_7}}; color: {{COLOR_1}}">
                {{CONTACT_CALL}} <i class="fas fa-arrow-right"></i>
              </a>
            </div>
          </div>

          <!-- Side Image -->
          <div class="md:col-span-4 rounded-[3rem] overflow-hidden group shadow-2xl">
            [[HERO_IMAGE]]
          </div>

          <div class="md:col-span-4 rounded-[3rem] overflow-hidden group shadow-2xl h-[400px]">
             [[ABOUT_IMAGE]]
          </div>
          <div class="md:col-span-8 p-12 md:p-20 rounded-[3rem] backdrop-blur-3xl border border-white border-opacity-5 flex flex-col justify-center" style="background-color: {{COLOR_3}}">
            <h2 class="text-3xl md:text-5xl font-black mb-8">{{ABOUT_TITLE}}</h2>
            <div class="text-lg md:text-xl opacity-70 leading-loose">{{ABOUT_TEXT}}</div>
          </div>
        </div>

        [[REVIEWS_AREA]]

        <div class="mt-8 p-12 md:p-24 rounded-[4rem] text-center relative overflow-hidden" id="contato" style="background-color: {{COLOR_2}}">
           <h2 class="text-5xl md:text-7xl font-black mb-16 italic">Entre no Loop</h2>
           <div class="grid md:grid-cols-3 gap-12 relative z-10">
             <div class="space-y-4">
               <span class="text-xs uppercase tracking-[0.3em] opacity-40 font-black">Conectar</span>
               <p class="text-2xl font-bold">{{PHONE}}</p>
             </div>
             <div class="space-y-4">
               <span class="text-xs uppercase tracking-[0.3em] opacity-40 font-black">Email</span>
               <p class="text-2xl font-bold">{{EMAIL}}</p>
             </div>
             <div class="space-y-4">
               <span class="text-xs uppercase tracking-[0.3em] opacity-40 font-black">Onde estamos</span>
               <p class="text-2xl font-bold">{{ADDRESS}}</p>
             </div>
           </div>
           <div class="mt-20 rounded-[3rem] overflow-hidden border border-white border-opacity-10">
             [[MAP_AREA]]
           </div>
        </div>
      </main>

      <footer class="p-12 text-center">
         <p class="text-sm opacity-20 font-black uppercase tracking-[1em]">© ${new Date().getFullYear()} {{BUSINESS_NAME}}</p>
      </footer>
    </div>
  `,
  layout_minimal_elegance: `
    <div class="template-layout-minimal-elegance" style="background-color: white; color: #111; font-family: 'Playfair Display', serif;">
      <header class="p-10 flex flex-col items-center gap-10">
        [[LOGO_AREA]]
        <nav class="flex gap-12 text-sm font-light tracking-[0.2em] uppercase border-y py-4 px-10 border-black border-opacity-10">
          <a href="#sobre" class="hover:opacity-50 transition-opacity">Nossa Essência</a>
          <a href="#contato" class="hover:opacity-50 transition-opacity">Atendimento</a>
        </nav>
      </header>

      <main class="max-w-5xl mx-auto px-6">
        <section class="py-32 text-center">
          <h1 class="text-5xl md:text-8xl font-light mb-12 tracking-tight italic">{{HERO_TITLE}}</h1>
          <p class="text-lg md:text-xl font-light opacity-60 mb-16 max-w-2xl mx-auto leading-relaxed">{{HERO_SUBTITLE}}</p>
          <a href="#contato" class="inline-block border border-black px-16 py-5 hover:bg-black hover:text-white transition-all duration-500 uppercase text-xs tracking-widest font-black">{{CONTACT_CALL}}</a>
        </section>

        <section class="py-12">
          <div class="aspect-[16/6] overflow-hidden rounded-sm grayscale hover:grayscale-0 transition-all duration-1000">
            [[HERO_IMAGE]]
          </div>
        </section>

        <section id="sobre" class="py-32 grid md:grid-cols-2 gap-24 items-center">
          <div class="order-2 md:order-1">
            <h2 class="text-3xl font-light mb-12 tracking-widest uppercase border-b pb-4">{{ABOUT_TITLE}}</h2>
            <div class="text-xl font-light leading-relaxed opacity-80">{{ABOUT_TEXT}}</div>
          </div>
          <div class="order-1 md:order-2 aspect-square overflow-hidden bg-gray-100">
             [[ABOUT_IMAGE]]
          </div>
        </section>

        [[REVIEWS_AREA]]

        <section id="contato" class="py-32 border-t border-black border-opacity-5">
           <div class="text-center max-w-2xl mx-auto">
             <h2 class="text-xs uppercase tracking-[0.5em] font-black mb-16 opacity-30 text-center">Contact Details</h2>
             <div class="space-y-12">
                <div>
                  <h4 class="font-black italic mb-2">Social</h4>
                  <p class="text-2xl font-light">{{PHONE}}</p>
                </div>
                <div>
                  <h4 class="font-black italic mb-2">Location</h4>
                  <p class="text-2xl font-light">{{ADDRESS}}</p>
                </div>
             </div>
             <div class="mt-20 grayscale border border-black border-opacity-5 p-2">
               [[MAP_AREA]]
             </div>
           </div>
        </section>
      </main>

      <footer class="p-20 text-center border-t border-black border-opacity-5">
          [[LOGO_AREA]]
          <p class="mt-10 text-[10px] uppercase tracking-[0.3em] opacity-40">© ${new Date().getFullYear()} {{BUSINESS_NAME}} — Designed for Elegance</p>
      </footer>
    </div>
  `,
  layout_dynamic_flow: `
    <div class="template-layout-dynamic-flow" style="background-color: {{COLOR_1}}; color: {{COLOR_4}}">
      <header class="p-6 flex justify-between items-center relative z-20">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full overflow-hidden" style="background-color: {{COLOR_7}}">[[LOGO_AREA]]</div>
          <span class="font-black tracking-tighter text-xl">{{BUSINESS_NAME}}</span>
        </div>
        [[SOCIAL_LINKS_CONTAINER]]
      </header>

      <main class="overflow-x-hidden">
        <!-- Floating Hero -->
        <section class="min-h-screen flex items-center justify-center p-6 relative">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br opacity-5" style="background-image: linear-gradient(to bottom right, {{COLOR_7}}, transparent)"></div>
          <div class="max-w-5xl mx-auto text-center relative z-10 translate-y-10 opacity-0 animate-reveal">
            <span class="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-8" style="background-color: {{COLOR_7}}; color: {{COLOR_1}}">Novo Lançamento</span>
            <h1 class="text-6xl md:text-9xl font-black mb-10 tracking-tighter leading-none">{{HERO_TITLE}}</h1>
            <p class="text-xl md:text-2xl opacity-70 mb-16 max-w-2xl mx-auto leading-tight">{{HERO_SUBTITLE}}</p>
            <a href="#contato" class="group relative inline-flex items-center gap-4 text-2xl font-black">
               {{CONTACT_CALL}}
               <span class="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-2" style="background-color: {{COLOR_7}}; color: {{COLOR_1}}"><i class="fas fa-chevron-right"></i></span>
            </a>
          </div>
        </section>

        <!-- Zig Zag 1 -->
        <section id="sobre" class="py-32 px-6">
          <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-24">
            <div class="md:w-1/2 relative">
               <div class="absolute -bottom-8 -right-8 w-full h-full rounded-[4rem] z-0" style="background-color: {{COLOR_3}}"></div>
               [[ABOUT_IMAGE]]
            </div>
            <div class="md:w-1/2">
              <h2 class="text-5xl font-black mb-10 leading-tight">{{ABOUT_TITLE}}</h2>
              <div class="text-lg opacity-80 leading-relaxed space-y-6">{{ABOUT_TEXT}}</div>
            </div>
          </div>
        </section>

        [[REVIEWS_AREA]]

        <!-- Zig Zag 2 -->
        <section class="py-32 px-6" style="background-color: {{COLOR_2}}">
          <div class="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-24">
            <div class="md:w-1/2">
               [[HERO_IMAGE]]
            </div>
            <div class="md:w-1/2">
              <h2 class="text-5xl font-black mb-10 leading-tight">Excelência <br/>em Movimento</h2>
              <p class="text-xl opacity-70 leading-relaxed italic">"Nós não apenas entregamos resultados, nós criamos experiências que definem o futuro do seu negócio."</p>
            </div>
          </div>
        </section>

        <section id="contato" class="py-32 px-6 relative overflow-hidden">
           <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 relative z-10">
              <div class="p-12 rounded-[4rem] flex flex-col justify-between" style="background-color: {{COLOR_3}}">
                <h2 class="text-5xl font-black mb-12 italic">Fale Conosco</h2>
                <div class="space-y-8">
                   <div>
                     <span class="block text-xs font-black uppercase opacity-40 mb-2">Direct Line</span>
                     <p class="text-3xl font-black tracking-tighter">{{PHONE}}</p>
                   </div>
                   <div>
                     <span class="block text-xs font-black uppercase opacity-40 mb-2">Location</span>
                     <p class="text-3xl font-black tracking-tighter">{{ADDRESS}}</p>
                   </div>
                </div>
              </div>
              <div class="rounded-[4rem] overflow-hidden shadow-2xl border-8 border-opacity-10 border-white">
                [[MAP_AREA]]
              </div>
           </div>
        </section>
      </main>

      <footer class="p-12 flex flex-col md:flex-row justify-between items-center gap-8 bg-black bg-opacity-20">
         [[LOGO_AREA]]
         <div class="flex gap-6 items-center">
           [[SOCIAL_LINKS]]
           [[SOCIAL_LINKS_CONTAINER]]
         </div>
         <p class="text-[10px] font-black uppercase opacity-20 tracking-tighter">© ${new Date().getFullYear()} {{BUSINESS_NAME}}. Powered by SiteZing Dynamic Flow.</p>
      </footer>
    </div>
    <style>
      @keyframes reveal { to { opacity: 1; transform: translateY(0); } }
      .animate-reveal { animation: reveal 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    </style>
  `
};
