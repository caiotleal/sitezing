import React, { Suspense, lazy, useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { httpsCallable } from 'firebase/functions';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { auth, functions, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Settings, Upload, Loader2, RefreshCw, Briefcase, FileText, X, Phone, Globe, CheckCircle, CheckCircle2, Save, Trash2, AlertCircle, LayoutDashboard, MapPin, Copy, ExternalLink, Zap, Search, Star, ShieldCheck, CreditCard, User, LogIn, LogOut, Info, Sparkles, ChevronRight, ChevronDown, ChevronUp, Gift, Menu, HelpCircle, Palette, Check, Instagram, Edit3, Clock, ArrowRight
} from 'lucide-react';
import { TEMPLATES } from './components/templates';
import { useIframeEditor } from './components/useIframeEditor';
import { BRAND_LOGO } from './components/brand';
import ProfileForm from './components/ProfileForm';
import SupportModal from './components/SupportModal';
import MobileBottomNav from './components/MobileBottomNav';

// HELPER PARA CARREGAMENTO RESILIENTE DE COMPONENTES
const lazyWithRetry = (componentImport: any) =>
  lazy(() =>
    componentImport().catch((error: any) => {
      console.error('Falha ao carregar componente dinâmico. Recarregando site...', error);
      window.location.reload();
      return { default: () => null };
    })
  );

const LoginPage = lazyWithRetry(() => import('./components/LoginPage'));
const DomainChecker = lazyWithRetry(() => import('./components/DomainChecker'));

// ERROR BOUNDARY PARA RESILIÊNCIA GLOBAL
class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro Crítico no App:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
            <RefreshCw className="w-10 h-10 text-orange-500 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black uppercase mb-4 tracking-tighter italic">Ops! Algo deu errado</h1>
          <p className="text-zinc-400 text-sm max-w-sm mb-8 leading-relaxed">Não se preocupe, isso pode acontecer após uma atualização do sistema. Vamos recarregar sua sessão agora para resolver.</p>
          <button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-orange-500/20">Recarregar Editor</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LAYOUT_STYLES = [
  { id: 'layout_modern_center', label: 'Centro Imponente', desc: 'Hero centralizado, animações verticais' },
  { id: 'layout_modern_split', label: 'Split Dinâmico', desc: 'Metades divididas com entradas laterais' },
  { id: 'layout_glass_grid', label: 'Grid em Vidro', desc: 'Containers invisíveis em formato grid' },
  { id: 'layout_minimal_elegance', label: 'Elegância Minimalista', desc: 'Foco total na tipografia e respiro' },
  { id: 'layout_dynamic_flow', label: 'Fluxo Contínuo', desc: 'Seções em zigue-zague com fade' },
];

const COLORS = [
  { id: 'obsidian', name: 'Obsidiana', c1: '#000000', c2: '#0a0a0a', c3: '#171717', c4: '#ffffff', c5: '#d4d4d8', c6: '#a1a1aa', c7: '#71717a', light: '#ffffff', dark: '#000000' },
  { id: 'slate', name: 'Ardósia', c1: '#020617', c2: '#0f172a', c3: '#1e293b', c4: '#3b82f6', c5: '#60a5fa', c6: '#93c5fd', c7: '#bfdbfe', light: '#f8fafc', dark: '#020617' },
  { id: 'snow', name: 'Neve Pura', c1: '#ffffff', c2: '#f4f4f5', c3: '#e4e4e7', c4: '#09090b', c5: '#27272a', c6: '#3f3f46', c7: '#52525b', light: '#09090b', dark: '#ffffff' },
  { id: 'celeste_suave', name: 'Celeste Suave', c1: '#F0F9FF', c2: '#E0F2FE', c3: '#BAE6FD', c4: '#0369A1', c5: '#0284C7', c6: '#475569', c7: '#0EA5E9', light: '#FFFFFF', dark: '#0F172A' },
  { id: 'celeste_aurora', name: 'Celeste Aurora', c1: '#FDFEFE', c2: '#F0F9FF', c3: '#E0F2FE', c4: '#075985', c5: '#0369A1', c6: '#64748B', c7: '#F59E0B', light: '#FFFFFF', dark: '#020617' },
  { id: 'celeste_nuvens', name: 'Celeste Nuvens', c1: '#F8FAFC', c2: '#F1F5F9', c3: '#E2E8F0', c4: '#0F172A', c5: '#334155', c6: '#64748B', c7: '#0284C7', light: '#FFFFFF', dark: '#0F172A' },
  { id: 'celeste_brisa', name: 'Celeste Brisa', c1: '#ECFEFF', c2: '#CFFAFE', c3: '#A5F3FC', c4: '#164E63', c5: '#0891B2', c6: '#3F6212', c7: '#06B6D4', light: '#FFFFFF', dark: '#083344' },
  { id: 'celeste_cristal', name: 'Celeste Cristal', c1: '#FFFFFF', c2: '#F4F4F5', c3: '#E4E4E7', c4: '#0369A1', c5: '#0284C7', c6: '#94A3B8', c7: '#3B82F6', light: '#FFFFFF', dark: '#0F172A' },
  { id: 'marinha_profundo', name: 'Marinha Profundo', c1: '#0A192F', c2: '#112240', c3: '#233554', c4: '#F8FAFC', c5: '#E2E8F0', c6: '#8892B0', c7: '#64FFDA', light: '#0A192F', dark: '#F8FAFC' },
  { id: 'marinha_classico', name: 'Marinha Clássico', c1: '#0B1120', c2: '#151F32', c3: '#1E293B', c4: '#F1F5F9', c5: '#CBD5E1', c6: '#94A3B8', c7: '#3B82F6', light: '#0B1120', dark: '#F8FAFC' },
  { id: 'marinha_oceano', name: 'Marinha Oceano', c1: '#0F172A', c2: '#1E293B', c3: '#334155', c4: '#F8FAFC', c5: '#E2E8F0', c6: '#94A3B8', c7: '#0EA5E9', light: '#0F172A', dark: '#FFFFFF' },
  { id: 'marinha_noturno', name: 'Marinha Noturno', c1: '#020617', c2: '#0F172A', c3: '#1E293B', c4: '#F8FAFC', c5: '#E2E8F0', c6: '#64748B', c7: '#818CF8', light: '#020617', dark: '#FFFFFF' },
  { id: 'marinha_atlantico', name: 'Marinha Atlântico', c1: '#082F49', c2: '#0C4A6E', c3: '#164E63', c4: '#ECFEFF', c5: '#CFFAFE', c6: '#A5F3FC', c7: '#22D3EE', light: '#082F49', dark: '#ECFEFF' },
  { id: 'med_santorini', name: 'Mediterrâneo Santorini', c1: '#FAFAFA', c2: '#F4F4F5', c3: '#E5E7EB', c4: '#0F172A', c5: '#1E293B', c6: '#64748B', c7: '#0284C7', light: '#FFFFFF', dark: '#0F172A' },
  { id: 'med_terracota', name: 'Mediterrâneo Terracota', c1: '#FFF7ED', c2: '#FFEDD5', c3: '#FED7AA', c4: '#431407', c5: '#78350F', c6: '#9A3412', c7: '#EA580C', light: '#FFFFFF', dark: '#431407' },
  { id: 'med_azeite', name: 'Mediterrâneo Azeite', c1: '#FAFAF9', c2: '#F5F5F4', c3: '#E7E5E4', c4: '#1C1917', c5: '#292524', c6: '#57534E', c7: '#65A30D', light: '#FFFFFF', dark: '#1C1917' },
  { id: 'med_areia', name: 'Mediterrâneo Areia', c1: '#FEFCE8', c2: '#FEF9C3', c3: '#FEF08A', c4: '#451A03', c5: '#78350F', c6: '#A16207', c7: '#0284C7', light: '#FFFFFF', dark: '#451A03' },
  { id: 'med_capri', name: 'Mediterrâneo Capri', c1: '#FFFFFF', c2: '#F0FDF4', c3: '#DCFCE7', c4: '#064E3B', c5: '#065F46', c6: '#475569', c7: '#10B981', light: '#FFFFFF', dark: '#064E3B' },
  { id: 'caribe_coral', name: 'Caribe Coral', c1: '#FFF1F2', c2: '#FFE4E6', c3: '#FECDD3', c4: '#F43F5E', c5: '#E11D48', c6: '#9F1239', c7: '#0D9488', light: '#FFFFFF', dark: '#4C0519' },
  { id: 'caribe_turquesa', name: 'Caribe Turquesa', c1: '#F0FDFA', c2: '#CCFBF1', c3: '#99F6E4', c4: '#0D9488', c5: '#0F766E', c6: '#115E59', c7: '#F59E0B', light: '#FFFFFF', dark: '#134E4A' },
  { id: 'caribe_sol', name: 'Caribe Sol', c1: '#FFFBEB', c2: '#FEF3C7', c3: '#FDE047', c4: '#D97706', c5: '#B45309', c6: '#78350F', c7: '#0D9488', light: '#FFFFFF', dark: '#451A03' },
  { id: 'caribe_paraiso', name: 'Caribe Paraíso', c1: '#F8FAFC', c2: '#E0F2FE', c3: '#BAE6FD', c4: '#0284C7', c5: '#0369A1', c6: '#0C4A6E', c7: '#F43F5E', light: '#FFFFFF', dark: '#0C4A6E' },
  { id: 'caribe_brisa', name: 'Caribe Brisa', c1: '#FAFAF9', c2: '#F5F5F4', c3: '#E7E5E4', c4: '#D97706', c5: '#B45309', c6: '#78350F', c7: '#14B8A6', light: '#FFFFFF', dark: '#292524' },
];

const PROMO_HTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SiteZing - Criação Inteligente em Segundos</title>
  <meta name="description" content="Tenha seu site profissional online em segundos. Inteligência Artificial que cria, escreve e publica para você.">
  <meta property="og:title" content="SiteZing - Seu Site Pronto em Segundos">
  <meta property="og:description" content="Tenha seu site online sem gastar nada por 7 dias. Teste agora a evolução da criação de sites!">
  <meta property="og:image" content="${BRAND_LOGO}">
  <meta property="og:url" content="https://sitezing.com.br">
  <meta property="og:type" content="website">

  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html, body { -ms-overflow-style: none; scrollbar-width: none; background-color: #FAFAF9; color: #1C1917; font-family: sans-serif; overflow-x: hidden; }
    ::-webkit-scrollbar { display: none; }
    .glass-card { background: #ffffff; border: 1px solid #e7e5e4; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.03); position: relative; }
    .glass-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
    .hero-form-card { background: #ffffff; border-radius: 2.5rem; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.15); border: 1px solid #e7e5e4; }
    .badge-label { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 12px; border-radius: 99px; background: #f5f5f4; color: #78716c; }
    
    @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .animate-up { animation: fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    .plan-bg-logo { position: absolute; bottom: -15%; right: -10%; width: 70%; height: auto; opacity: 0.03; pointer-events: none; filter: grayscale(100%); }
    
    @keyframes zingPulse { 0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(249, 115, 22, 0); } 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); } }
    .share-float-btn { display: none !important; }
    .share-float-btn:hover { transform: scale(1.1) rotate(15deg); background: #ea580c; }
    .card-share-btn { position: absolute; bottom: 20px; right: 20px; width: 32px; height: 32px; background: #f5f5f4; color: #78716c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; opacity: 0; transform: translateY(10px); transition: all 0.3s ease; z-index: 20; }
    .glass-card:hover .card-share-btn { opacity: 1; transform: translateY(0); }
    .card-share-btn:hover { background: #f97316; color: white; }

    .react-vite-badge { display: flex; items-center: center; gap: 6px; background: #ffffff; border: 1px solid #e7e5e4; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #444; }

    @media (min-width: 1024px) {
      body { display: block; }
      main { padding: 0 8% !important; margin: 0 !important; }
      header { height: 80px !important; }
      .footer-commercial { height: 80px; }
    }
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
  <script>
    async function zingShare(text) {
      const shareData = {
        title: "SiteZing - Seu Site Pronto em Segundos",
        text: text || "Tenha seu site online sem gastar nada por 7 dias! Crie seu site profissional em segundos com a SiteZing! 🚀",
        url: window.location.origin
      };
      try {
        if (navigator.share) { await navigator.share(shareData); }
        else { 
          const dummy = document.createElement('input');
          document.body.appendChild(dummy);
          dummy.value = window.location.origin;
          dummy.select();
          document.execCommand('copy');
          document.body.removeChild(dummy);
          alert('Link copiado para a área de transferência!');
        }
      } catch (err) { console.log('Erro ao compartilhar:', err); }
    }

      // State Synchronization & Population
      window.addEventListener('message', function(e) {
        if (!e.data) return;
        
        if (e.data.type === 'SYNC_STATE') {
          var domainStatus = e.data.domainStatus || {};
          var sFeed = document.getElementById('slug-feedback');
          if (sFeed) {
            if (domainStatus.loading) {
              sFeed.innerText = 'Validando...';
              sFeed.className = 'text-[9px] font-black text-stone-400 animate-pulse uppercase tracking-widest';
            } else if (domainStatus.available === true) {
              sFeed.innerText = '✓ Disponível';
              sFeed.className = 'text-[9px] font-black text-emerald-500 uppercase tracking-widest';
            } else if (domainStatus.available === false) {
              sFeed.innerText = '✗ Indisponível';
              sFeed.className = 'text-[9px] font-black text-red-500 uppercase tracking-widest';
            }
          }
        }

        if (e.data.type === 'SHOW_SYNC_UI') {
          document.getElementById('sync-name').innerText = e.data.name;
          document.getElementById('sync-area').classList.remove('hidden');
          document.getElementById('search-area').classList.add('hidden');
          document.getElementById('search-feedback').classList.add('hidden');
          syncFormData();
        }

        if (e.data.type === 'SHOW_SEARCH_ERROR') {
          var fb = document.getElementById('search-feedback');
          fb.innerText = e.data.msg || 'Empresa não encontrada.';
          fb.classList.remove('hidden', 'text-stone-400');
          fb.classList.add('text-red-500');
          document.getElementById('import-btn-icon').className = 'fas fa-search';
        }

        if (e.data.type === 'RESET_SEARCH_UI') {
          document.getElementById('sync-area').classList.add('hidden');
          document.getElementById('search-area').classList.remove('hidden');
          document.getElementById('search-feedback').classList.add('hidden');
          document.getElementById('hero-google-search').value = '';
          document.getElementById('import-btn-icon').className = 'fas fa-search';
          syncFormData();
        }

        if (e.data.type === 'FILL_FIELDS') {
          var data = e.data.data;
          if (data.name) document.getElementById('hero-name').value = data.name;
          if (data.description) document.getElementById('hero-desc').value = data.description;
          if (data.slug) document.getElementById('hero-slug').value = data.slug;
          
          document.getElementById('sync-area').innerHTML = '<div class="text-[10px] font-black text-emerald-600 bg-emerald-50 p-2 rounded-lg flex items-center gap-2 animate-bounce"><i class="fas fa-check-circle"></i> Tudo Sincronizado!</div>';
          document.getElementById('submit-btn').classList.remove('opacity-50', 'pointer-events-none');
          
          syncFormData();
        }
      });

      function syncFormData() {
        window.parent.postMessage({
          type: 'SYNC_FORM_DATA',
          data: {
            businessName: document.getElementById('hero-name').value,
            description: document.getElementById('hero-desc').value,
            customSlug: document.getElementById('hero-slug').value,
            googleSearch: document.getElementById('hero-google-search').value
          }
        }, '*');
      }

      function triggerImport() {
        var query = document.getElementById('hero-google-search').value;
        if (query.length < 3) return;
        document.getElementById('import-btn-icon').className = 'fas fa-sync-alt animate-spin';
        document.getElementById('search-feedback').innerText = 'Buscando empresa...';
        document.getElementById('search-feedback').classList.remove('hidden', 'text-red-500');
        document.getElementById('search-feedback').classList.add('text-stone-400');
        window.parent.postMessage({ type: 'TRIGGER_FETCH_GOOGLE', value: query }, '*');
      }

      function triggerSyncAction() {
        window.parent.postMessage({ type: 'ACTION_CONFIRM_GOOGLE' }, '*');
      }

      function resetSearch() {
        window.parent.postMessage({ type: 'ACTION_RESET_GOOGLE' }, '*');
      }

      function submitCreate() {
        syncFormData();
        setTimeout(() => {
          window.parent.postMessage({ type: 'SUBMIT_CREATE' }, '*');
        }, 50);
      }
    </script>
</head>
<body class="antialiased selection:bg-orange-500 selection:text-white">
  
  <header class="fixed top-0 left-0 w-full z-[80] bg-[#FAFAF9]/80 backdrop-blur-md border-b border-stone-200/60 h-20 flex items-center px-6 md:px-20 transition-all">
    <div class="w-full mx-auto flex items-center justify-between">
       <img src="${BRAND_LOGO}" alt="SiteZing Logo" class="h-10 md:h-14 w-auto drop-shadow-sm" />
       <div onclick="zingShare()" class="cursor-pointer bg-white border border-stone-200 w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-orange-500 hover:border-orange-500 transition-all shadow-sm">
         <i class="fas fa-share-alt"></i>
       </div>
    </div>
  </header>

  <main class="pt-8 pb-8 px-6 md:px-20 w-full mx-auto flex flex-col min-h-screen relative overflow-x-hidden">
    <div class="h-16 md:h-20 w-full"></div>
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-200/30 blur-[150px] rounded-full pointer-events-none"></div>
    <div class="max-w-7xl mx-auto w-full relative z-10 animate-up mb-12 mt-6 md:mt-16 grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-8 items-start text-left">
      
      <div class="pt-8">
        <div class="flex flex-wrap items-center gap-3 mb-6 justify-start">
          <div class="react-vite-badge shadow-sm px-3 py-1.5"><i class="fab fa-react text-[#61DAFB]"></i> React 19</div>
          <div class="react-vite-badge shadow-sm px-3 py-1.5"><i class="fas fa-bolt text-yellow-500"></i> Vite 6</div>
          <div class="react-vite-badge shadow-sm px-3 py-1.5"><i class="fas fa-robot text-teal-500"></i> Gemini AI</div>
        </div>

        <h1 class="text-[3.2rem] md:text-[6rem] font-black leading-[0.85] tracking-tighter mb-6 uppercase italic text-stone-900 drop-shadow-sm">
          Seu site pronto em um <span class="text-orange-500 drop-shadow-sm">ZING!!!</span>
        </h1>

        <p class="text-lg md:text-xl text-stone-500 font-bold leading-relaxed max-w-xl mb-8">
          Inteligência Artificial que cria sua presença online em segundos. Simples, rápido e automático.
        </p>

        <div class="bg-orange-500/10 border border-orange-500/20 text-orange-600 px-8 py-5 rounded-2xl md:max-w-xl flex items-center gap-4 transition-all hover:bg-orange-500/15 group">
           <div class="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
              <i class="fas fa-gift"></i>
           </div>
           <div>
              <div class="text-[10px] font-black uppercase tracking-widest opacity-60">Oferta Exclusiva</div>
              <div class="text-lg font-black uppercase italic tracking-tight">Experimente Grátis por 7 Dias</div>
           </div>
        </div>
      </div>

      <div class="hero-form-card overflow-hidden sticky top-24 scale-[0.95] origin-top">
        <div class="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50/50">
          <img src="${BRAND_LOGO}" class="h-5 opacity-40" />
          <div class="flex items-center gap-3">
            <button class="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">Login</button>
            <button class="text-stone-300 hover:text-stone-900"><i class="fas fa-times"></i></button>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5"><i class="fab fa-google"></i> Busca Google IA</label>
            <div id="search-area" class="flex gap-2">
              <input type="text" id="hero-google-search" placeholder="Empresa ou Link Google" oninput="syncFormData()" class="flex-1 bg-stone-100 border border-stone-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all text-stone-900" />
              <button onclick="triggerImport()" class="bg-blue-600 hover:bg-black text-white px-3 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-90"><i id="import-btn-icon" class="fas fa-search"></i></button>
            </div>
            <div id="search-feedback" class="hidden text-[9px] font-bold text-stone-400 mt-1 ml-1 animate-pulse"></div>
            <div id="sync-area" class="hidden animate-up">
               <div class="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col items-center gap-2 text-center relative">
                  <button onclick="resetSearch()" class="absolute top-2 right-2 text-stone-300 hover:text-red-500 transition-colors"><i class="fas fa-undo-alt text-[10px]"></i></button>
                  <span id="sync-name" class="text-xs font-black text-stone-900 pr-4"></span>
                  <button onclick="triggerSyncAction()" class="w-full bg-blue-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Sincronizar Dados</button>
               </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Nome do Negócio</label>
            <input type="text" id="hero-name" placeholder="Ex: Eletricista Silva" oninput="syncFormData()" class="w-full bg-stone-100 border border-stone-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-orange-500 transition-all text-stone-900" />
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Ideia Principal</label>
            <textarea id="hero-desc" placeholder="Descreva os serviços..." oninput="syncFormData()" class="w-full bg-stone-100 border border-stone-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-orange-500 transition-all text-stone-900 h-20 resize-none"></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em] ml-1">Endereço Web</label>
            <div class="bg-stone-100 border border-stone-100 rounded-xl px-4 py-2.5 flex items-center gap-1 focus-within:bg-white focus-within:border-emerald-500 transition-all">
               <input type="text" id="hero-slug" placeholder="meu-site" oninput="syncFormData()" class="flex-1 bg-transparent border-none outline-none text-xs font-bold text-stone-900 p-0 text-right" />
               <span class="text-[9px] font-black text-stone-300 uppercase shrink-0">.sitezing.com.br</span>
               <div id="slug-feedback" class="shrink-0"></div>
            </div>
          </div>

          <button id="submit-btn" onclick="submitCreate()" class="w-full py-5 rounded-2xl bg-[#1c1c1c] text-white font-black uppercase tracking-[0.15em] text-[10px] shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 opacity-50 pointer-events-none">
             ✨ Gerar Meu Site
          </button>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-6 relative z-10 animate-up" style="animation-delay: 0.2s;">
      __PRICING_CARDS__
    </div>

    
    <div id="google-reviews-section" class="mt-20 relative z-10 animate-up opacity-0" style="animation-delay: 0.4s;">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-black text-stone-900 uppercase italic">O que dizem sobre nós</h2>
        <div class="flex items-center justify-center gap-1 mt-2">
          <i class="fas fa-star text-amber-400"></i>
          <i class="fas fa-star text-amber-400"></i>
          <i class="fas fa-star text-amber-400"></i>
          <i class="fas fa-star text-amber-400"></i>
          <i class="fas fa-star text-amber-400"></i>
          <span class="ml-2 text-sm font-bold text-stone-500">Avaliações Reais no Google</span>
        </div>
      </div>
      <div id="reviews-grid" class="grid md:grid-cols-3 gap-6">
        __REVIEWS_START__
        <div class="glass-card p-6 rounded-2xl border-stone-200/40 text-left">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-400"><i class="fas fa-user"></i></div>
            <div>
              <div class="font-bold text-sm text-stone-800">Cliente Satisfeito</div>
              <div class="flex text-[10px] text-amber-400"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
            </div>
          </div>
          <p class="text-xs text-stone-500 leading-relaxed italic">"A SiteZing facilitou muito a criação do meu site. Em poucos minutos estava tudo pronto e online!"</p>
        </div>
        <div class="glass-card p-6 rounded-2xl border-stone-200/40 text-left">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-400"><i class="fas fa-user"></i></div>
            <div>
              <div class="font-bold text-sm text-stone-800">Empreendedor Digital</div>
              <div class="flex text-[10px] text-amber-400"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
            </div>
          </div>
          <p class="text-xs text-stone-500 leading-relaxed italic">"Incrível como a IA entende o que a gente precisa. O design ficou profissional e muito rápido."</p>
        </div>
        <div class="glass-card p-6 rounded-2xl border-stone-200/40 text-left hidden md:block">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-400"><i class="fas fa-user"></i></div>
            <div>
              <div class="font-bold text-sm text-stone-800">Loja Local</div>
              <div class="flex text-[10px] text-amber-400"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
            </div>
          </div>
          <p class="text-xs text-stone-500 leading-relaxed italic">"O suporte é excelente e a plataforma é muito intuitiva. Recomendo para todos os meus parceiros."</p>
        </div>
        __REVIEWS_END__
      </div>
    </div>
  </main>

  <footer class="footer-commercial bg-white border-t border-stone-200 py-6 px-6 md:px-12 relative z-50">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-center md:text-left">
        &copy; 2024 SiteZing. Todos os direitos reservados. 
        <br/><span class="text-stone-300">Tecnologia proprietária de criação acelerada.</span>
      </div>
      <div class="flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
        <div class="flex flex-col items-center">
          <i class="fab fa-google text-2xl mb-1"></i>
          <span class="text-[8px] font-black uppercase">Google Cloud Partner</span>
        </div>
        <div class="flex flex-col items-center">
          <i class="fas fa-fire-alt text-2xl mb-1"></i>
          <span class="text-[8px] font-black uppercase">Firebase Certified Architecture</span>
        </div>
        <div class="flex flex-col items-center">
          <i class="fas fa-cloud text-2xl mb-1"></i>
          <span class="text-[8px] font-black uppercase">Cloudflare Global Network</span>
        </div>
        <div class="flex flex-col items-center">
          <i class="fas fa-shield-alt text-2xl mb-1"></i>
          <span class="text-[8px] font-black uppercase">Site Blindado SSL</span>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>
`;

const getDynamicPromoHtml = (platformConfigs: any) => {
  const configs = platformConfigs || {};

  let html = PROMO_HTML;

  // 1. Render Pricing Cards (Core Conversion)
  const plans = [...(configs.plans || [])].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
  let cardsHtml = ``;

  plans.forEach((p: any) => {
    const intervalLabel =
      p.interval === 'month' ? 'mês' :
        p.interval === 'bimestral' ? 'bimestre' :
          p.interval === 'trimestral' ? 'trimestre' :
            p.interval === 'semestral' ? 'semestre' :
              p.interval === 'year' ? 'ano' : 'período';

    const isAnual = p.interval === 'year';
    const integer = p.price.toString().split('.')[0];
    const decimal = p.price.toString().split('.')[1] || '00';

    cardsHtml += `
      <div class="glass-card p-6 rounded-[1.5rem] overflow-hidden group ${isAnual ? 'border-orange-300' : 'border-teal-200'}" onclick="window.parent.postMessage({ type: 'OPEN_PLAN_MODAL', priceId: '${p.priceId}', plan: '${p.name.toLowerCase()}' }, '*')">
        <div class="card-share-btn" onclick="sharePlan('${p.name.toLowerCase()}')" title="Compartilhar este plano"><i class="fas fa-share-alt"></i></div>
        <img src="${BRAND_LOGO}" class="plan-bg-logo" />
        <div class="absolute top-0 right-0 ${p.badge ? 'bg-orange-600' : (isAnual ? 'bg-orange-500' : 'bg-teal-600')} text-white text-[8px] font-black tracking-widest px-3 py-1.5 rounded-bl-xl uppercase shadow-md">
          ${p.badge || (isAnual ? 'Mais Econômico' : 'Popular')}
        </div>
        <h3 class="text-lg font-black mb-1 italic uppercase ${isAnual ? 'text-orange-500' : 'text-teal-600'} mt-1">${p.name}</h3>
        <p class="text-stone-400 mb-4 text-[11px] leading-tight">${p.description || 'Hospedagem profissional SiteZing'}</p>
        <div class="text-3xl font-black mb-0 text-stone-900">R$ ${integer}<span class="text-xl">,${decimal}</span> <span class="text-[10px] text-stone-400 font-normal">/ ${intervalLabel}</span></div>
        ${p.allowInstallments ? `
          <div style="font-size: 9px; font-weight: 800; color: #10b981; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            <i class="fas fa-credit-card"></i> Ou em até ${p.maxInstallments || 12}x no cartão
          </div>
        ` : '<div style="height: 14px;"></div>'}
        <ul class="space-y-2 text-stone-500 text-[11px] font-medium mt-4">
          ${p.features.map((f: string) => `
            <li class="flex items-center gap-2"><span class="w-4 h-4 rounded-full ${isAnual ? 'bg-orange-100 text-orange-500' : 'bg-teal-100 text-teal-600'} flex items-center justify-center text-[8px]">✔</span> ${f}</li>
          `).join('')}
        </ul>
        <div class="mt-4 text-[9px] text-stone-400 text-center uppercase tracking-widest font-bold group-hover:text-orange-500 transition-colors">Clique para contratar</div>
      </div>
    `;
  });

  html = html.replace('__PRICING_CARDS__', cardsHtml);

  // 2. Render Google Reviews (Social Proof)
  if (configs.reviews && configs.reviews.length > 0) {
    const reviewsHtml = configs.reviews.slice(0, 3).map((r: any) => `
      <div class="glass-card p-6 rounded-2xl border-stone-200/40 text-left relative overflow-hidden">
        <div class="flex items-center gap-3 mb-4">
          <img src="${r.profile_photo_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full border border-stone-100 object-cover" />
          <div>
            <div class="font-bold text-sm text-stone-800">${r.author_name}</div>
            <div class="flex text-[10px] text-amber-400">
              ${Array(Math.floor(r.rating || 5)).fill('<i class="fas fa-star"></i>').join('')}
            </div>
          </div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" class="absolute top-6 right-6 opacity-20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        <p class="text-xs text-stone-500 leading-relaxed italic mb-4">"${r.text}"</p>
        <div class="text-[9px] font-bold text-stone-300 uppercase tracking-widest">${r.relative_time_description || ''}</div>
      </div>
    `).join('');

    html = html.replace(/<div id="google-reviews-section"[^>]*class="[^"]*opacity-0[^"]*"/i, (match) => match.replace('opacity-0', 'opacity-100'));
    html = html.replace(/__REVIEWS_START__[\s\S]*?__REVIEWS_END__/i, reviewsHtml);
  } else {
    // Hidden if no reviews
    html = html.replace(/<div id="google-reviews-section"[^>]*class="[^"]*"/i, '<div style="display:none;"');
  }

  // Final Polish: Ensure no placeholders remain visible
  html = html.replace(/__REVIEWS_START__|__REVIEWS_END__/g, '');

  return html;
};

const cleanHtmlForPublishing = (rawHtml: string | null, preserveEditable = false) => {
  if (!rawHtml) return '';
  if (!rawHtml.includes('editor-toolbar')) return rawHtml;

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const tb = doc.querySelector('#editor-toolbar'); if (tb) tb.remove();
  const imgTb = doc.querySelector('#image-toolbar'); if (imgTb) imgTb.remove();
  const sc = doc.querySelector('#editor-script'); if (sc) sc.remove();
  const st = doc.querySelector('#editor-style'); if (st) st.remove();

  doc.querySelectorAll('.editable-element').forEach(el => {
    el.removeAttribute('contenteditable');
    el.classList.remove('editable-element');
    if (el.getAttribute('class') === '') el.removeAttribute('class');
  });

  if (!preserveEditable) {
    doc.querySelectorAll('.editable-image-wrapper').forEach(wrapper => {
      const hasImg = wrapper.querySelector('img');
      if (!hasImg) {
        wrapper.remove();
      } else {
        wrapper.classList.remove('editable-image-wrapper');
        const core = wrapper.querySelector('.editable-image');
        if (core) {
          core.classList.remove('editable-image', 'border-2', 'border-dashed', 'border-zinc-600', 'cursor-pointer', 'hover:border-emerald-500');
          core.querySelectorAll('i, span').forEach(el => el.remove());
        }
      }
    });
  }

  return doc.documentElement.outerHTML;
};

const getPreviewHtml = (baseHtml: string | null) => {
  if (!baseHtml) return '';
  const clean = cleanHtmlForPublishing(baseHtml, true);

  const editorScript = `
    <style id="editor-style">
      html, body { -ms-overflow-style: none; scrollbar-width: none; }
      ::-webkit-scrollbar { display: none; }
      .custom-editor-toolbar { position: absolute; display: none; background: #18181b; padding: 8px; border-radius: 10px; border: 1px solid #3f3f46; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 99999; gap: 8px; align-items: center; font-family: sans-serif; }
      .color-picker-group { display: flex; align-items: center; gap: 4px; background: #27272a; padding: 2px 6px 2px 8px; border-radius: 6px; border: 1px solid #3f3f46; }
      .color-picker-label { color: #a1a1aa; font-size: 10px; font-weight: bold; }
      .custom-editor-toolbar input[type="color"] { width: 22px; height: 22px; border: none; cursor: pointer; background: transparent; padding: 0; }
      .custom-editor-toolbar select { background: #27272a; color: white; border: 1px solid #3f3f46; border-radius: 6px; padding: 4px 8px; font-size: 12px; outline: none; cursor: pointer; height: 30px; }
      .custom-editor-toolbar button#text-delete { background: #ef444415; border: 1px solid #ef444450; color: #ef4444; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; padding: 0 10px; transition: all 0.2s; height: 30px; display: flex; align-items: center; gap: 4px; }
      .editable-element { transition: all 0.2s; outline: 2px dashed transparent; outline-offset: 2px; }
      .editable-element:hover { outline-color: rgba(160, 160, 160, 0.5); cursor: pointer; }
      .editable-element:focus { outline-color: #ffffff; }
      .editable-image { position: relative; transition: all 0.2s; overflow: hidden; }
      .editable-image:hover { background: transparent; }
      @keyframes guide-pulse {
        0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); transform: scale(1); }
        50% { box-shadow: 0 0 0 15px rgba(249, 115, 22, 0); transform: scale(1.05); }
        100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); transform: scale(1); }
      }
      .animate-guide-pulse {
        animation: guide-pulse 2s infinite;
      }
    </style>
    <div id="editor-toolbar" class="custom-editor-toolbar">
      <div class="color-picker-group" title="Cor do Texto (Fonte)"><span class="color-picker-label">T</span><input type="color" id="fore-color-picker" /></div>
      <div class="color-picker-group" title="Cor do Fundo (Background)"><span class="color-picker-label">F</span><input type="color" id="bg-color-picker" /></div>
      <select id="text-size" title="Tamanho"><option value="1">Pequeno</option><option value="3" selected>Normal</option><option value="5">Grande</option><option value="7">Gigante</option></select>
      <select id="text-font" title="Fonte"><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Courier New">Courier</option><option value="Verdana">Verdana</option></select>
      <div style="width: 1px; height: 20px; background: #3f3f46; margin: 0 4px;"></div>
      <button id="text-delete" title="Apagar Elemento">✖ Excluir</button>
    </div>

    <div id="image-toolbar" class="custom-editor-toolbar flex gap-2">
      <button id="btn-upload" style="background: #27272a; color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: none;">📤 Upload</button>
      <button id="btn-ai" style="background: #10b981; color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: none;">✨ Gerar com IA</button>
      <button id="btn-enhance" style="background: #3b82f6; color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: none;" title="Melhorar Qualidade e Gerar Descrição SEO">⚡ Melhorar IA</button>
      <button id="btn-img-delete" style="color: #ef4444; background: none; border: none; font-size: 12px; cursor: pointer; margin-left: 4px;">✖ Remover</button>
    </div>

    <script id="editor-script">
      document.addEventListener('DOMContentLoaded', () => {
        const textToolbar = document.getElementById('editor-toolbar');
        const imgToolbar = document.getElementById('image-toolbar');
        const foreColorPicker = document.getElementById('fore-color-picker');
        const bgColorPicker = document.getElementById('bg-color-picker');
        let currentTarget = null;
        let currentImgTarget = null;

        function sendCleanHtml() {
          const clone = document.documentElement.cloneNode(true);
          const tbs = clone.querySelectorAll('.custom-editor-toolbar, #editor-script, #editor-style');
          tbs.forEach(el => el.remove());
          clone.querySelectorAll('.editable-element').forEach(el => { el.removeAttribute('contenteditable'); el.classList.remove('editable-element'); if (el.getAttribute('class') === '') el.removeAttribute('class'); });
          window.parent.postMessage({ type: 'CONTENT_EDITED', html: clone.outerHTML }, '*');
        }

        function rgbToHex(rgb) {
          if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
          const match = rgb.match(/^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*(\\d+(?:\\.\\d+)?))?\\)$/);
          if(!match) return '#000000';
          function hex(x) { return ("0" + parseInt(x).toString(16)).slice(-2); }
          return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
        }

        document.querySelectorAll('h1, h2, h3, h4, p, span, a, button, img, .icon-btn').forEach(el => {
          if(textToolbar.contains(el) || imgToolbar.contains(el)) return; 
          el.setAttribute('contenteditable', 'true');
          el.classList.add('editable-element');
          el.addEventListener('focus', (e) => {
            imgToolbar.style.display = 'none';
            currentTarget = el;
            foreColorPicker.value = rgbToHex(window.getComputedStyle(el).color);
            bgColorPicker.value = rgbToHex(window.getComputedStyle(el).backgroundColor);
            const rect = el.getBoundingClientRect();
            textToolbar.style.display = 'flex';
            
            if (rect.top < 60) {
              textToolbar.style.top = (rect.bottom + window.scrollY + 10) + 'px';
            } else {
              textToolbar.style.top = (rect.top + window.scrollY - 60) + 'px';
            }
            
            textToolbar.style.left = Math.max(10, rect.left + window.scrollX) + 'px';
          });
        });

        document.querySelectorAll('.editable-image').forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            textToolbar.style.display = 'none';
            currentImgTarget = el;
            const rect = el.getBoundingClientRect();
            imgToolbar.style.display = 'flex';
            
            let topPos = rect.top + window.scrollY + 10;
            if (rect.top < 10) { topPos = rect.bottom + window.scrollY - 50; }
            imgToolbar.style.top = topPos + 'px';
            
            imgToolbar.style.left = (rect.left + window.scrollX + 10) + 'px';
          });
        });

        document.addEventListener('click', (e) => {
          if (textToolbar.style.display === 'flex' && !textToolbar.contains(e.target) && e.target !== currentTarget) {
             textToolbar.style.display = 'none'; sendCleanHtml();
          }
          if (imgToolbar.style.display === 'flex' && !imgToolbar.contains(e.target) && !e.target.closest('.editable-image')) {
             imgToolbar.style.display = 'none';
          }
        });

        document.getElementById('text-delete').addEventListener('click', () => {
          if (currentTarget) { currentTarget.remove(); textToolbar.style.display = 'none'; sendCleanHtml(); }
        });
        foreColorPicker.addEventListener('input', (e) => { document.execCommand('foreColor', false, e.target.value); sendCleanHtml(); });
        bgColorPicker.addEventListener('input', (e) => { if(currentTarget) { currentTarget.style.backgroundColor = e.target.value; currentTarget.style.backgroundImage = 'none'; sendCleanHtml(); } });
        document.getElementById('text-size').addEventListener('change', (e) => { document.execCommand('fontSize', false, e.target.value); sendCleanHtml(); });
        document.getElementById('text-font').addEventListener('change', (e) => { document.execCommand('fontName', false, e.target.value); sendCleanHtml(); });

        document.getElementById('btn-upload').addEventListener('click', () => {
          window.parent.postMessage({ type: 'REQUEST_UPLOAD', targetId: currentImgTarget.dataset.id }, '*');
          imgToolbar.style.display = 'none';
        });

        document.getElementById('btn-ai').addEventListener('click', () => {
          imgToolbar.style.display = 'none';
          if (!currentImgTarget) return;

          currentImgTarget.innerHTML = '<div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 460px; background: #18181b; padding: 16px; border-radius: 12px; border: 1px solid #3f3f46; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 50;"><span style="color: #10b981; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">✨ Gerar Imagem com IA</span><input type="text" id="ai-img-prompt" placeholder="Ex: foto realista de um hamburguer na mesa" style="width: 100%; background: #27272a; color: white; padding: 10px 12px; border-radius: 8px; border: 1px solid #52525b; outline: none; font-size: 13px;" autocomplete="off"><div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;"><button id="ai-img-cancel" style="background: transparent; color: #a1a1aa; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: none;">Cancelar</button><button id="ai-img-confirm" style="background: #10b981; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: none;">Gerar Imagem</button></div></div>';

          setTimeout(() => { const inp = document.getElementById('ai-img-prompt'); if(inp) inp.focus(); }, 50);

          document.getElementById('ai-img-cancel').addEventListener('click', (e) => {
            e.stopPropagation();
            currentImgTarget.innerHTML = '<i class="fas fa-camera text-4xl mb-3"></i><span class="text-xs font-bold uppercase tracking-widest">Adicionar Imagem</span>';
          });

          document.getElementById('ai-img-confirm').addEventListener('click', (e) => {
            e.stopPropagation();
            const inp = document.getElementById('ai-img-prompt');
            const promptText = inp ? inp.value.trim() : '';
            if(!promptText) return;

            currentImgTarget.innerHTML = '<div style="display:flex; flex-direction:column; align-items:center; color:#10b981;"><i class="fas fa-circle-notch fa-spin text-3xl mb-3"></i><span class="text-xs font-bold uppercase tracking-widest">Criando imagem realista...</span></div>';
            window.parent.postMessage({ type: 'REQUEST_AI', targetId: currentImgTarget.dataset.id, prompt: promptText }, '*');
          });
        });

        document.getElementById('btn-enhance').addEventListener('click', () => {
          imgToolbar.style.display = 'none';
          if (!currentImgTarget) return;

          const img = currentImgTarget.querySelector('img');
          const imgSrc = img ? img.src : null;
          
          if (!imgSrc || imgSrc.includes('placeholder')) {
             alert("A primeira imagem ainda não foi carregada. Envie uma foto para poder melhorá-la!");
             return;
          }

          currentImgTarget.innerHTML = '<div style="display:flex; flex-direction:column; align-items:center; color:#3b82f6;"><i class="fas fa-magic fa-spin text-3xl mb-3"></i><span class="text-xs font-bold uppercase tracking-widest">Melhorando Qualidade e SEO...</span></div>';
          window.parent.postMessage({ type: 'REQUEST_ENHANCE_IMAGE', targetId: currentImgTarget.dataset.id, url: imgSrc }, '*');
        });

        document.getElementById('btn-img-delete').addEventListener('click', () => {
          if (currentImgTarget) { 
            currentImgTarget.innerHTML = '<i class="fas fa-camera text-4xl mb-3"></i><span class="text-xs font-bold uppercase tracking-widest">Adicionar Imagem (Opcional)</span>';
            sendCleanHtml(); 
            imgToolbar.style.display = 'none';
          }
        });

        window.addEventListener('message', (e) => {
          if (e.data.type === 'INSERT_IMAGE') {
            const targetEl = document.querySelector('.editable-image[data-id="' + e.data.targetId + '"]');
            if (targetEl) {
              const alt = e.data.alt || "";
              targetEl.innerHTML = '<img src="' + e.data.url + '" alt="' + alt + '" title="' + alt + '" class="w-full h-full block object-contain" style="border-radius: inherit; margin: 0; box-shadow: none;" />';
              sendCleanHtml();
            }
          }
        });
      });
    </script>
  `;
  return clean.replace(/<\/body>/i, `${editorScript}</body>`);
};

const extractCustomImages = (html: string | null) => {
  if (!html) return {};
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images: Record<string, string> = {};
  doc.querySelectorAll('.editable-image').forEach(el => {
    const id = el.getAttribute('data-id');
    const img = el.querySelector('img');
    if (id && img && img.src) {
      images[id] = img.src;
    }
  });
  return images;
};

const GuidedTip: React.FC<{
  step: number;
  currentStep: number;
  text: string;
  position?: 'top' | 'bottom';
}> = ({ step, currentStep, text, position = 'top' }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (step === currentStep) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 10000); // 10s auto-hide

      const handleDismiss = () => setVisible(false);
      window.addEventListener('mousedown', handleDismiss);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('mousedown', handleDismiss);
      };
    }
  }, [step, currentStep]);

  if (step !== currentStep || !visible) return null;

  const isBottom = position === 'bottom';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: isBottom ? -10 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: isBottom ? -10 : 10 }}
      className={`absolute z-[200] bg-stone-800/95 backdrop-blur-md text-white/90 px-3 py-2 rounded-xl shadow-2xl border border-stone-700/50 font-medium text-[10px] flex items-center gap-2 max-w-[180px] text-center pointer-events-none whitespace-normal leading-tight`}
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        [isBottom ? 'top' : 'bottom']: 'calc(100% + 12px)'
      }}
    >
      <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent ${isBottom ? 'top-[-6px] border-b-[6px] border-b-stone-800/95' : 'bottom-[-6px] border-t-[6px] border-t-stone-800/95'
        }`}></div>
      <Sparkles size={12} className="shrink-0 text-orange-400" />
      {text}
    </motion.div>
  );
};

const getExpirationTimestampMs = (expiresAt: any): number | null => {
  if (!expiresAt) return null;
  if (typeof expiresAt === 'number') return expiresAt;
  if (typeof expiresAt === 'string') {
    const parsed = new Date(expiresAt).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (expiresAt.toDate && typeof expiresAt.toDate === 'function') return expiresAt.toDate().getTime();
  if (typeof expiresAt.seconds === 'number') return expiresAt.seconds * 1000;
  if (typeof expiresAt._seconds === 'number') return expiresAt._seconds * 1000;
  return null;
};

// DOMÍNIOS DA PLATAFORMA QUE CARREGAM O EDITOR
const BUILDER_DOMAINS = ['localhost', 'sitezing.com.br', 'www.sitezing.com.br', 'criador-de-site-1a91d.web.app', 'criador-de-site-1a91d.firebaseapp.com'];

const App: React.FC = () => {

  // ==============================================================================
  // INTERCEPTADOR DE SUBDOMÍNIO (WILDCARD) E DOMÍNIO CUSTOMIZADO DO CLIENTE
  // ==============================================================================
  const [isClientSiteView, setIsClientSiteView] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();

    // Se a URL acessada NÃO for a plataforma principal, é o site de um cliente
    if (!BUILDER_DOMAINS.includes(host)) {
      setIsClientSiteView(true);
      const fetchSite = async () => {
        try {
          const getSiteFn = httpsCallable(functions, 'getSiteContent');
          const res: any = await getSiteFn({ domain: host });
          if (res.data?.html) {
            document.open();
            document.write(res.data.html);
            document.close();
          }
        } catch (error: any) {
          document.body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background:#FAFAF9; color:#1C1917;">
              <h1 style="font-size: 2.5rem; margin-bottom: 10px; font-weight: 900;">Site Indisponível</h1>
              <p style="color: #57534E;">${error.message || 'O site que você está procurando não existe ou foi suspenso.'}</p>
            </div>
          `;
        }
      };
      fetchSite();
    }
  }, []);

  // Limpeza de usuários anônimos ao fechar a guia
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        auth.currentUser.delete().catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

   const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFloatModal, setShowFloatModal] = useState(false);
  const [isMobileWizardOpen, setIsMobileWizardOpen] = useState(false);
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [googleStatus, setGoogleStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);
  const [aiContent, setAiContent] = useState<any>(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [selectedPlanModal, setSelectedPlanModal] = useState<'free' | 'monthly' | 'annual' | any | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [checkoutDetailsModal, setCheckoutDetailsModal] = useState<{ projectId: string, planType: string, priceId?: string } | null>(null);
  const [checkoutTermsAccepted, setCheckoutTermsAccepted] = useState(false);
  const [cancelModalProject, setCancelModalProject] = useState<string | null>(null);
  const [cancelTermsAccepted, setCancelTermsAccepted] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const [loggedUserEmail, setLoggedUserEmail] = useState<string | null>(auth.currentUser?.email || null);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'geral' | 'dominio' | 'assinatura' | 'plataforma'>('dashboard');
  const [currentProjectSlug, setCurrentProjectSlug] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUpdatePublish, setIsUpdatePublish] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [publishModalUrl, setPublishModalUrl] = useState<string | null>(null);
  const [officialDomain, setOfficialDomain] = useState('');
  const [registerLater, setRegisterLater] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const [customDomainInput, setCustomDomainInput] = useState('');
  const [isLinkingDomain, setIsLinkingDomain] = useState(false);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [platformConfigs, setPlatformConfigs] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isDnsModalOpen, setIsDnsModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileWizardStep, setMobileWizardStep] = useState(1);
  const [activeMobileSheet, setActiveMobileSheet] = useState<string | number | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'home' | 'editar' | 'plano'>('home');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categoryNavRef = useRef<HTMLDivElement>(null);
  const [isNavDragging, setIsNavDragging] = useState(false);
  const [navStartX, setNavStartX] = useState(0);
  const [navScrollLeft, setNavScrollLeft] = useState(0);

  const handleNavMouseDown = (e: React.MouseEvent) => {
    if (!categoryNavRef.current) return;
    setIsNavDragging(true);
    setNavStartX(e.pageX - categoryNavRef.current.offsetLeft);
    setNavScrollLeft(categoryNavRef.current.scrollLeft);
  };

  const handleNavMouseLeave = () => setIsNavDragging(false);
  const handleNavMouseUp = () => setIsNavDragging(false);

  const handleNavMouseMove = (e: React.MouseEvent) => {
    if (!isNavDragging || !categoryNavRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryNavRef.current.offsetLeft;
    const walk = (x - navStartX) * 2; // Multiplicador de velocidade
    categoryNavRef.current.scrollLeft = navScrollLeft - walk;
  };

  const ribbonNavRef = useRef<HTMLDivElement>(null);
  const [isRibbonDragging, setIsRibbonDragging] = useState(false);
  const [ribbonStartX, setRibbonStartX] = useState(0);
  const [ribbonScrollLeft, setRibbonScrollLeft] = useState(0);

  const handleRibbonMouseDown = (e: React.MouseEvent) => {
    if (!ribbonNavRef.current) return;
    setIsRibbonDragging(true);
    setRibbonStartX(e.pageX - ribbonNavRef.current.offsetLeft);
    setRibbonScrollLeft(ribbonNavRef.current.scrollLeft);
  };

  const handleRibbonMouseLeave = () => setIsRibbonDragging(false);
  const handleRibbonMouseUp = () => setIsRibbonDragging(false);

  const handleRibbonMouseMove = (e: React.MouseEvent) => {
    if (!isRibbonDragging || !ribbonNavRef.current) return;
    e.preventDefault();
    const x = e.pageX - ribbonNavRef.current.offsetLeft;
    const walk = (x - ribbonStartX) * 2;
    ribbonNavRef.current.scrollLeft = ribbonScrollLeft - walk;
  };

  // Sincroniza Bottom Nav com os Modais de Configuração
  useEffect(() => {
    if (isMobile) {
      if (mobileActiveTab === 'editar') {
        setActiveMobileSheet('visual');
        setIsMobileWizardOpen(true);
      } else if (mobileActiveTab === 'plano') {
        setActiveMobileSheet('plano');
        setIsMobileWizardOpen(true);
      } else if (mobileActiveTab === 'home') {
        setIsMobileWizardOpen(false);
      }
    }
  }, [mobileActiveTab, isMobile]);

  const [formData, setFormData] = useState({
    businessName: '', description: '', region: '', whatsapp: '', instagram: '', facebook: '', linkedin: '', tiktok: '',
    youtube: '', x: '', rappi: '', zeDelivery: '', directLink: '',
    ifood: '', noveNove: '', keeta: '', phone: '', email: '', address: '', showMap: true,
    showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa',
    logoBase64: '', logoSize: 40, segment: '', googlePlaceUrl: '', showReviews: false, reviews: [] as any[], editorialSummary: '',
    customSlug: '', isCustomSlugEdited: false, googlePhotos: [] as string[],
    headerLayout: 'logo_left_icons_right',
    manualCss: '',
    directLinkLabel: '',
    faviconBase64: '',
    seoDescription: '',
    isSeoDescriptionEdited: false
  });
  const [pendingSave, setPendingSave] = useState(false);
  const [isSaveReminderOpen, setIsSaveReminderOpen] = useState(false);

  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isPlansBannerOpen, setIsPlansBannerOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const handledStripeReturnRef = React.useRef(false);

  const handleSupportSubmit = async (subject: string, message: string) => {
    try {
      const submitFn = httpsCallable(functions, 'submitSupportTicket');
      await submitFn({
        subject,
        message,
        email: userProfile?.email || loggedUserEmail || '',
        name: userProfile?.fullName || '',
        phone: userProfile?.phone || ''
      });
      showToast('Mensagem enviada! Retornaremos no seu e-mail em breve.', 'success');
    } catch (error: any) {
      throw error;
    }
  };

  const [publishMsgIndex, setPublishMsgIndex] = useState(0);
  const publishMsgs = [
    "Compilando a nova estrutura do seu site...",
    "Vinculando certificados de segurança e SSL...",
    "Propagando conteúdo na rede global do Google Cloud...",
    "Otimizando a velocidade de carregamento...",
    "Quase lá! Seu projeto está sendo finalizado..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPublishing) {
      setPublishMsgIndex(0);
      interval = setInterval(() => setPublishMsgIndex(prev => (prev + 1) % publishMsgs.length), 3000);
    }
    return () => clearInterval(interval);
  }, [isPublishing]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#criarsite') {
        setShowFloatModal(true); setIsTrialModalOpen(false); setIsPlansBannerOpen(false); setIsHowItWorksOpen(false);
      } else if (hash === '#vantagens') {
        setIsTrialModalOpen(true); setShowFloatModal(false); setIsPlansBannerOpen(false); setIsHowItWorksOpen(false);
      } else if (hash === '#planos') {
        setIsPlansBannerOpen(true); setShowFloatModal(false); setIsTrialModalOpen(false); setIsHowItWorksOpen(false);
      } else if (hash === '#comofunciona') {
        setIsHowItWorksOpen(true); setShowFloatModal(false); setIsTrialModalOpen(false); setIsPlansBannerOpen(false);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);


  useEffect(() => {
    if (handledStripeReturnRef.current || savedProjects.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const tab = params.get('tab');
    const projectId = params.get('project');

    if (payment !== 'success' || tab !== 'status' || !projectId) return;

    const matchedProject = savedProjects.find((p: any) => p.id === projectId || p.projectSlug === projectId);
    if (!matchedProject) return;

    handledStripeReturnRef.current = true;
    handleLoadProject(matchedProject);
    setActiveTab('assinatura');
    setIsMenuOpen(true);
    showToast('Pagamento confirmado! Abrimos o status do seu site.', 'success');
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  }, [savedProjects]);

  const [floatDomainStatus, setFloatDomainStatus] = useState<{ loading: boolean; available?: boolean; slug?: string; alternatives?: string[] }>({ loading: false });
  const floatCheckTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [isInstantGenerating, setIsInstantGenerating] = useState(false);

  const nextGuideStep = (step: number) => {
    if (guideStep < step) setGuideStep(step);
  };

  const fetchGoogleData = async (autoConfirm = false, overrideQuery?: string) => {
    const query = overrideQuery || formData.googlePlaceUrl;
    if (!query) return;
    
    setIsFetchingGoogle(true);
    setGoogleStatus(null);
    setPendingGoogleData(null);
    if (autoConfirm) setIsInstantGenerating(true);

    try {
      const fetchFn = httpsCallable(functions, 'fetchGoogleBusiness');
      const res: any = await fetchFn({ query });
      
      if (autoConfirm && res.data?.results?.[0]) {
        // Se for geração instantânea, injetamos os dados e já disparamos a geração (Pega o 1º resultado)
        const d = res.data.results[0];
        const updates: any = {};
        if (d.name) updates.businessName = d.name;
        if (d.phone) updates.whatsapp = d.phone;
        if (d.address) updates.address = d.address;
        if (d.reviews && d.reviews.length > 0) {
          updates.reviews = d.reviews;
          updates.showReviews = true;
        }
        if (d.photos && d.photos.length > 0) updates.googlePhotos = d.photos;
        
        // DURANTE A CRIAÇÃO: Descrição = Nome da Empresa, Favicon = Vazio
        if (!currentProjectSlug) {
          if (d.editorialSummary) updates.editorialSummary = d.editorialSummary;
          updates.description = d.name || d.editorialSummary || '';
          updates.seoDescription = d.name || d.editorialSummary || '';
          updates.faviconBase64 = ''; 
        }

        // Injetar Redes Sociais se encontradas
        if (d.socialLinks) {
          if (d.socialLinks.instagram) updates.instagram = d.socialLinks.instagram;
          if (d.socialLinks.facebook) updates.facebook = d.socialLinks.facebook;
          if (d.socialLinks.whatsapp) updates.whatsapp = d.socialLinks.whatsapp;
          if (d.socialLinks.linkedin) updates.linkedin = d.socialLinks.linkedin;
          if (d.socialLinks.tiktok) updates.tiktok = d.socialLinks.tiktok;
          if (d.socialLinks.youtube) updates.youtube = d.socialLinks.youtube;
        }

        setFormData(prev => ({ ...prev, ...updates }));
        
        const desc = d.editorialSummary || `Uma empresa moderna e inovadora chamada ${d.name || formData.businessName}.`;
        handleGenerate(desc);
        setIsMenuOpen(true);
        setActiveTab('geral');
        setGoogleStatus({ type: 'success', msg: 'Google Inteligência ativada!' });
      } else if (res.data?.results) {
        if (res.data.results.length === 1) {
          setPendingGoogleData(res.data.results[0]);
          setGoogleStatus({ type: 'success', msg: 'Localizamos a empresa!' });
        } else {
          setGoogleResults(res.data.results);
          setGoogleStatus({ type: 'success', msg: 'Vários locais encontrados. Selecione o correto abaixo:' });
        }
      } else {
        // Nada encontrado
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'SHOW_SEARCH_ERROR', msg: 'Empresa não localizada no Google.' }, '*');
        }
        showToast('Empresa não encontrada.', 'warning');
      }
      
      // Se localizou (pelo menos 1), avisa o Iframe para mostrar o botão de Sincronizar
      if (res.data?.results && res.data.results.length >= 1) {
        const first = res.data.results[0];
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
           iframe.contentWindow.postMessage({ type: 'SHOW_SYNC_UI', name: first.name }, '*');
        }
      }
    } catch (e: any) {
      setGoogleStatus({ type: 'error', msg: e.message });
      setIsInstantGenerating(false);
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'SHOW_SEARCH_ERROR', msg: 'Erro na busca (500). Verifique o nome.' }, '*');
      }
    } finally {
      setIsFetchingGoogle(false);
      if (autoConfirm) setIsInstantGenerating(false);
    }
  };

  const confirmGoogleInjection = () => {
    if (!pendingGoogleData) return;
    const d = pendingGoogleData;
    const updates: any = {};
    if (d.name) updates.businessName = d.name;
    if (d.phone) updates.whatsapp = d.phone;
    if (d.address) updates.address = d.address;
    if (d.reviews && d.reviews.length > 0) {
      updates.reviews = d.reviews;
      updates.showReviews = true;
    }
    if (d.photos && d.photos.length > 0) updates.googlePhotos = d.photos;
    
    // DURANTE A CRIAÇÃO: Descrição = Nome da Empresa, Favicon = Vazio
    if (!currentProjectSlug) {
      if (d.editorialSummary) updates.editorialSummary = d.editorialSummary;
      updates.description = d.name || d.editorialSummary || '';
      updates.seoDescription = d.name || d.editorialSummary || '';
      updates.faviconBase64 = ''; // Mantém sem favicon conforme pedido
    }

    // Injetar Redes Sociais se encontradas
    if (d.socialLinks) {
      if (d.socialLinks.instagram) updates.instagram = d.socialLinks.instagram;
      if (d.socialLinks.facebook) updates.facebook = d.socialLinks.facebook;
      if (d.socialLinks.whatsapp) updates.whatsapp = d.socialLinks.whatsapp;
      if (d.socialLinks.linkedin) updates.linkedin = d.socialLinks.linkedin;
      if (d.socialLinks.tiktok) updates.tiktok = d.socialLinks.tiktok;
      if (d.socialLinks.youtube) updates.youtube = d.socialLinks.youtube;
      if (d.socialLinks.keeta) updates.keeta = d.socialLinks.keeta;
    }

    setFormData(prev => {
      const nextState = { ...prev, ...updates };
      if (!nextState.isCustomSlugEdited && updates.businessName) {
        nextState.customSlug = slugify(updates.businessName).slice(0, 30);
        checkDomainDebounced(nextState.customSlug);
      }
      return nextState;
    });

    // Enviar dados preenchidos de volta para o iframe da Landing Page
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'FILL_FIELDS',
        data: {
          name: d.name,
          description: d.description || d.editorialSummary,
          slug: slugify(d.name || '').slice(0, 30)
        }
      }, '*');
    }

    setHasUnsavedChanges(true);
    setGoogleStatus({ type: 'success', msg: 'Google Inteligência ativada!' });
    setPendingGoogleData(null);

    // AUTO-GENERATE ON CONFIRMATION (Apenas se já estivermos no editor ou se o usuário não pediu para ver os campos preenchidos)
    // Para a Home (sem currentProjectSlug), deixamos o usuário ver os campos preenchidos antes de clicar no botão mágico final.
    if (currentProjectSlug) {
      const desc = d.editorialSummary || `Uma empresa moderna e inovadora chamada ${d.name || formData.businessName}.`;
      handleGenerate(desc);
    }
  };

  // Receptor de mensagens do iframe (Landing Page) consolidado acima
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SYNC_STATE',
        domainStatus: floatDomainStatus,
        isFetchingGoogle,
        googleStatus,
        pendingGoogleData, // Added this
        formData: {
          businessName: formData.businessName,
          customSlug: formData.customSlug,
          googlePlaceUrl: formData.googlePlaceUrl
        }
      }, '*');
    }
  }, [floatDomainStatus, isFetchingGoogle, googleStatus, pendingGoogleData, formData.businessName, formData.customSlug, formData.googlePlaceUrl]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  const slugify = (value = "") => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

  async function handleSaveOrUpdateSite() {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      setPendingSave(true);
      setIsLoginOpen(true);
      return false;
    }

    if (!formData.businessName) return showToast('Preencha o Nome do Negócio antes de salvar.', 'warning');

    setIsSavingProject(true);
    try {
      let activeSlug = currentProjectSlug;
      const htmlToSave = cleanHtmlForPublishing(generatedHtml);
      if (currentProjectSlug) {
        const updateFn = httpsCallable(functions, 'updateSiteProject');
        await updateFn({ targetId: currentProjectSlug, html: htmlToSave, formData, aiContent });
        showToast('Alterações salvas com sucesso!', 'success');
      } else {
        const targetSlug = formData.customSlug || slugify(formData.businessName).slice(0, 30);
        const checkFn = httpsCallable(functions, 'checkDomainAvailability');
        const checkRes: any = await checkFn({ projectSlug: targetSlug });

        if (checkRes.data?.error) {
          console.warn("Aviso ao checar domínio:", checkRes.data.error);
          // Continua a execução e deixa o save tratar se der ruim
        } else if (checkRes.data && checkRes.data.available === false) {
          throw new Error('already-exists');
        }

        const saveFn = httpsCallable(functions, 'saveSiteProject');
        const res: any = await saveFn({
          businessName: formData.businessName,
          internalDomain: targetSlug,
          officialDomain: officialDomain || "Pendente",
          generatedHtml: htmlToSave,
          formData,
          aiContent
        });
        if (res.data?.projectSlug) {
          setCurrentProjectSlug(res.data.projectSlug);
          activeSlug = res.data.projectSlug;
        }
        showToast('Projeto criado e salvo!', 'success');
        nextGuideStep(3); // Passo 3: Publicar
      }
      setHasUnsavedChanges(false);

      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);
      return activeSlug;
    } catch (err: any) {
      if (err.message.includes('já está em uso') || err.message.includes('already-exists')) {
        showToast('Este nome de negócio já está em uso por outro site. Por favor, adicione um diferencial ao nome.', 'error');
      } else {
        showToast('Erro ao salvar o site: ' + err.message, 'error');
      }
      return false;
    }
    finally { setIsSavingProject(false); }
  }

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const getConfigs = httpsCallable(functions, 'getPlatformConfigsPublic');
        const res: any = await getConfigs();
        setPlatformConfigs(res.data);
      } catch (e) {
        console.error("Erro ao buscar configs publicas:", e);
      }
    };
    if (!isClientSiteView) fetchConfigs();
  }, [isClientSiteView]);

  useEffect(() => {
    if (!generatedHtml && !currentProjectSlug && !isClientSiteView) {
      // const timer = setTimeout(() => setShowFloatModal(true), 0);
      // return () => clearTimeout(timer);
    }
  }, [generatedHtml, currentProjectSlug, isClientSiteView]);

  const checkDomainDebounced = (slugToCheck: string) => {
    if (slugToCheck.length < 3) {
      setFloatDomainStatus({ loading: false });
      return;
    }
    setFloatDomainStatus({ loading: true });
    if (floatCheckTimeout.current) clearTimeout(floatCheckTimeout.current);
    floatCheckTimeout.current = setTimeout(async () => {
      try {
        const checkFn = httpsCallable(functions, 'checkDomainAvailability');
        const res: any = await checkFn({ projectSlug: slugToCheck });
        if (res.data?.available) {
          setFloatDomainStatus({ loading: false, available: true, slug: res.data.checkedSlug });
        } else if (res.data && res.data.available === false) {
          const slug = res.data.checkedSlug || slugToCheck.toLowerCase().replace(/[^a-z0-9]/g, '');
          setFloatDomainStatus({
            loading: false, available: false, slug,
            alternatives: [`${slug}-br`, `${slug}-oficial`, `site-${slug}`]
          });
        }
      } catch (e) {
        setFloatDomainStatus({ loading: false });
      }
    }, 800);
  };

  const handleFloatNameChange = (val: string) => {
    setFormData(p => {
      let nextSlug = p.customSlug;
      if (!p.isCustomSlugEdited) {
        nextSlug = slugify(val).slice(0, 30);
        checkDomainDebounced(nextSlug);
      }
      return { ...p, businessName: val, customSlug: nextSlug };
    });
    setHasUnsavedChanges(true);
  };

  const handleDescriptionSync = (val: string) => {
    setFormData(p => {
      const updates: any = { description: val };
      if (!p.isSeoDescriptionEdited) {
        updates.seoDescription = val;
      }
      return { ...p, ...updates };
    });
    setHasUnsavedChanges(true);
  };

  const handleCustomSlugChange = (val: string) => {
    const safeSlug = slugify(val).slice(0, 30);
    setFormData(p => ({ ...p, customSlug: safeSlug, isCustomSlugEdited: true }));
    setHasUnsavedChanges(true);
    checkDomainDebounced(safeSlug);
  };

  useIframeEditor({ setGeneratedHtml, setHasUnsavedChanges });

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = BRAND_LOGO;
    if (!isClientSiteView) document.title = "SiteZing - Seu site pronto em um ZING !!!";
  }, [isClientSiteView]);

  // Receptor de mensagens do iframe (Landing Page) consolidado acima

  useEffect(() => {
    if (aiContent) {
      setGeneratedHtml(prevHtml => {
        const extractedImages = extractCustomImages(prevHtml);
        return renderTemplate(aiContent, formData, extractedImages);
      });
    }
  }, [formData.layoutStyle, formData.headerLayout, formData.colorId, formData.logoBase64, formData.logoSize, formData.whatsapp, formData.instagram, formData.facebook, formData.linkedin, formData.tiktok, formData.youtube, formData.x, formData.rappi, formData.zeDelivery, formData.directLink, formData.faviconBase64, formData.seoDescription, formData.ifood, formData.noveNove, formData.keeta, formData.showForm, formData.showFloatingContact, formData.showMap, formData.address, formData.phone, formData.email, formData.region, formData.showReviews, formData.reviews]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoggedUserEmail(user?.email || null);
      if (user) {
        try {
          const getProfileFn = httpsCallable(functions, 'getUserProfile');
          const res: any = await getProfileFn();
          setUserProfile(res.data);

          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: user.displayName || '',
            authProvider: user.providerData?.[0]?.providerId || 'password',
            lastLogin: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.error("Erro ao carregar perfil:", e);
        }
      } else {
        setUserProfile(null);
        // Anti-bot: Faz login anônimo automático se não houver usuário logado
        signInAnonymously(auth).catch(err => console.error("Erro no login anônimo:", err));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (loggedUserEmail && pendingSave) {
      setPendingSave(false);
      handleSaveOrUpdateSite();
    }
  }, [loggedUserEmail, pendingSave]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Se o visitante estiver visualizando um site de cliente, congela a tela de fundo
  if (isClientSiteView) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAF9]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
          <span className="text-stone-400 text-xs font-bold uppercase tracking-widest animate-pulse">Carregando Site...</span>
        </div>
      </div>
    );
  }

  const sharePlatform = async () => {
    const shareData = {
      title: "SiteZing - Seu Site Pronto em Segundos",
      text: "Tenha seu site online sem gastar nada por 7 dias! Crie seu site profissional em segundos com a SiteZing! 🚀",
      url: window.location.origin
    };
    try {
      if (navigator.share) { await navigator.share(shareData); }
      else {
        navigator.clipboard.writeText(window.location.origin);
        showToast('Link da SiteZing copiado!', 'success');
      }
    } catch (err) { console.log('Erro ao compartilhar:', err); }
  };

  // showToast was here, moved higher

  // ==============================================================================
  // CORREÇÃO: BUSCA DE PROJETOS E SINCRONIA DO AUTH
  // ==============================================================================
  useEffect(() => {
    const fetchProjects = async () => {
      if (!loggedUserEmail) {
        setSavedProjects([]);
        return;
      }
      try {
        const listFn = httpsCallable(functions, 'listUserProjects');
        const listRes: any = await listFn({});
        setSavedProjects(listRes.data?.projects || []);
      } catch (err) {
        console.error("Erro ao listar projetos:", err);
        setSavedProjects([]);
      }
    };
    fetchProjects();
  }, [loggedUserEmail]);

  const renderTemplate = (content: any, data: typeof formData, customImages: Record<string, string> = {}) => {
    let html = TEMPLATES[data.layoutStyle] || TEMPLATES['layout_modern_center'];
    html = html.replace('</header>', '</header><div class="h-28 md:h-36 w-full"></div>');
    const colors = COLORS.find(c => c.id === data.colorId) || COLORS[0];

    const replaceAll = (token: string, value: string) => { html = html.split(token).join(value); };
    const companyNameUpper = (data.businessName || 'Sua Empresa').toUpperCase();

    replaceAll('{{BUSINESS_NAME}}', companyNameUpper);
    replaceAll('{{HERO_TITLE}}', content.heroTitle || `Bem-vindo à ${data.businessName}`);
    replaceAll('{{HERO_SUBTITLE}}', content.heroSubtitle || 'Presença digital profissional.');
    replaceAll('{{ABOUT_TITLE}}', content.aboutTitle || 'Quem Somos');
    replaceAll('{{ABOUT_TEXT}}', content.aboutText || 'Nossa história e serviços.');
    replaceAll('{{CONTACT_CALL}}', content.contactCall || 'Fale conosco');

    replaceAll('{{COLOR_1}}', colors.c1); replaceAll('{{COLOR_2}}', colors.c2); replaceAll('{{COLOR_3}}', colors.c3);
    replaceAll('{{COLOR_4}}', colors.c4); replaceAll('{{COLOR_5}}', colors.c5); replaceAll('{{COLOR_6}}', colors.c6);
    replaceAll('{{COLOR_7}}', colors.c7); replaceAll('{{COLOR_LIGHT}}', colors.light); replaceAll('{{COLOR_DARK}}', colors.dark);

    replaceAll('{{ADDRESS}}', data.region ? `${data.address || 'Endereço não informado'} - ${data.region}` : (data.address || 'Endereço não informado'));
    replaceAll('{{PHONE}}', data.phone || data.whatsapp || 'Telefone não informado');
    replaceAll('{{EMAIL}}', data.email || 'Email não informado');

    let headInjection = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
      <meta name="description" content="${data.seoDescription || data.description || 'Confira nosso site profissional.'}">
      <meta property="og:title" content="${data.businessName || 'Meu Site Profissional'}">
      <meta property="og:description" content="${data.seoDescription || data.description || 'Confira nosso site profissional.'}">
      <meta property="og:image" content="${data.logoBase64 || BRAND_LOGO}">
      <meta property="og:type" content="website">
      <meta name="theme-color" content="${colors.c2}">
      <style>${data.manualCss || ''}</style>
      <script>
        async function zingShareSite() {
          const shareData = {
            title: "${data.businessName || 'Meu Site'}",
            text: "Confira o site profissional de ${data.businessName || 'minha empresa'}!",
            url: window.location.href
          };
          try {
            if (navigator.share) { await navigator.share(shareData); }
            else { 
              const dummy = document.createElement('input');
              document.body.appendChild(dummy);
              dummy.value = window.location.href;
              dummy.select();
              document.execCommand('copy');
              document.body.removeChild(dummy);
              alert('Link copiado para a área de transferência!');
            }
          } catch (err) { console.log('Erro ao compartilhar:', err); }
        }
      </script>
    `;

    const logoHeight = data.logoSize || 40;
    if (data.faviconBase64) {
      headInjection += `<link rel="icon" type="image/png" href="${data.faviconBase64}">`;
    }
    if (data.logoBase64) {
      headInjection += `<style>.glass-logo-premium img { max-height: ${logoHeight}px !important; }</style>`;
      html = html.replace(/\[\[LOGO_AREA\]\]/g, `<img src="${data.logoBase64}" style="max-height: ${logoHeight}px; width: auto; display: block; object-fit: contain; transition: transform 0.2s ease;" alt="Logo" />`);
    } else {
      html = html.replace(/\[\[LOGO_AREA\]\]/g, `<span style="font-weight: 900; font-size: 1.2rem; text-transform: uppercase;">${companyNameUpper}</span>`);
    }

    replaceAll('[[WHATSAPP_BTN]]', ''); replaceAll('[[INSTAGRAM_BTN]]', ''); replaceAll('[[FACEBOOK_BTN]]', '');
    replaceAll('[[TIKTOK_BTN]]', ''); replaceAll('[[LINKEDIN_BTN]]', ''); replaceAll('[[IFOOD_BTN]]', ''); replaceAll('[[NOVE_NOVE_BTN]]', ''); replaceAll('[[KEETA_BTN]]', '');

    let socialHtml = '';
    const addSocialBtn = (href: string, brandColor: string, label: string, innerHtml: string) => {
      socialHtml += `<a href="${href}" target="_blank" class="glass-social-link" style="color: ${brandColor};" title="${label}">${innerHtml}</a>`;
    };

    if (data.googlePlaceUrl) addSocialBtn(data.googlePlaceUrl.startsWith('http') ? data.googlePlaceUrl : `https://${data.googlePlaceUrl}`, '#4285F4', 'Google', '<i class="fab fa-google"></i>');
    if (data.whatsapp) addSocialBtn(`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`, '#25D366', 'WhatsApp', '<i class="fab fa-whatsapp"></i>');
    if (data.instagram) addSocialBtn(`https://instagram.com/${data.instagram.replace('@', '')}`, '#E1306C', 'Instagram', '<i class="fab fa-instagram"></i>');
    if (data.facebook) addSocialBtn(data.facebook.startsWith('http') ? data.facebook : `https://${data.facebook}`, '#1877F2', 'Facebook', '<i class="fab fa-facebook-f"></i>');
    if (data.linkedin) addSocialBtn(data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`, '#0A66C2', 'LinkedIn', '<i class="fab fa-linkedin-in"></i>');
    if (data.tiktok) addSocialBtn(data.tiktok.startsWith('http') ? data.tiktok : `https://${data.tiktok}`, '#000000', 'TikTok', '<i class="fab fa-tiktok"></i>');
    if (data.ifood) addSocialBtn(data.ifood.startsWith('http') ? data.ifood : `https://${data.ifood}`, '#EA1D2C', 'iFood', '<img src="https://cdn.simpleicons.org/ifood/EA1D2C" alt="iFood" style="width: 20px; height: 20px; object-fit: contain;"/>');
    if (data.noveNove) addSocialBtn(data.noveNove.startsWith('http') ? data.noveNove : `https://${data.noveNove}`, '#FFC700', '99', '<span style="font-size: 15px; font-weight: 900; line-height: 1;">99</span>');
    if (data.keeta) addSocialBtn(data.keeta.startsWith('http') ? data.keeta : `https://${data.keeta}`, '#19B84A', 'Keeta', '<span style="font-size: 15px; font-weight: 900; line-height: 1;">Keeta</span>');
    if (data.youtube) addSocialBtn(data.youtube.startsWith('http') ? data.youtube : `https://${data.youtube}`, '#FF0000', 'YouTube', '<i class="fab fa-youtube"></i>');
    if (data.x) addSocialBtn(data.x.startsWith('http') ? data.x : `https://${data.x}`, '#000000', 'X / Twitter', '<i class="fab fa-x-twitter"></i>');
    if (data.rappi) addSocialBtn(data.rappi.startsWith('http') ? data.rappi : `https://${data.rappi}`, '#FF441F', 'Rappi', '<span style="font-size: 15px; font-weight: 900; line-height: 1;">Rappi</span>');
    if (data.zeDelivery) addSocialBtn(data.zeDelivery.startsWith('http') ? data.zeDelivery : `https://${data.zeDelivery}`, '#FCCC24', 'Zé Delivery', '<span style="font-size: 15px; font-weight: 900; line-height: 1; color: black;">Zé</span>');
    if (data.directLink) addSocialBtn(data.directLink.startsWith('http') ? data.directLink : `https://${data.directLink}`, colors.c1, data.directLinkLabel || 'Link', `<div style="display:flex; items-center; gap: 5px;"><i class="fas fa-external-link-alt"></i> <span style="font-[9px]; font-weight: 900; text-transform: uppercase;">${data.directLinkLabel || 'Acessar'}</span></div>`);


    const shareBtnHtml = `<div class="glass-social-links-premium">[[SOCIAL_LINKS]]<div class="glass-social-link" onclick="zingShareSite()" title="Compartilhar Site" style="cursor:pointer; color: ${colors.c4};"><i class="fas fa-arrow-up-from-bracket"></i></div></div>`;
    replaceAll('[[SOCIAL_LINKS_CONTAINER]]', shareBtnHtml);
    replaceAll('[[SOCIAL_LINKS]]', socialHtml);

    const headerContactBtn = '';
    replaceAll('[[HEADER_CONTACT_BTN]]', headerContactBtn);
    replaceAll('[[HEADER_LAYOUT_CLASS]]', data.headerLayout || 'logo_left_icons_right');

    const footerBrand = `<div style="text-align:center; padding: 24px; font-size: 12px; opacity: 0.5; width: 100%; font-family: sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px;">Criado por <a href="https://sitezing.com.br" target="_blank" style="text-decoration: none; font-weight: 900; display: flex; align-items: center; gap: 4px; color: inherit; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'"><img src="${BRAND_LOGO}" style="height: 16px; width: auto;" alt="SiteZing"/> SiteZing.com.br</a></div>`;

    const floatingContactHtml = data.showFloatingContact ? `
      <style>
        .glass-contact-float { position: fixed; bottom: 30px; right: 30px; z-index: 9999; background: color-mix(in srgb, ${colors.c1} 60%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid ${colors.c3}; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${colors.c4}; box-shadow: 0 8px 32px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0; transform: translateY(20px) scale(0.8); pointer-events: none; text-decoration: none; }
        .glass-contact-float.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
        .glass-contact-float:hover { background: ${colors.c2}; border-color: ${colors.c7}; color: ${colors.c7}; transform: scale(1.1) rotate(5deg); }
        .glass-contact-float i { font-size: 1.5rem; }
      </style>
      <a href="#contato" class="glass-contact-float" id="zingFloatingContact">
        <i class="fas fa-comment-dots"></i>
      </a>
      <script>
        window.addEventListener('scroll', function() {
          const btn = document.getElementById('zingFloatingContact');
          if (btn) {
            if (window.scrollY > 300) { btn.classList.add('visible'); }
            else { btn.classList.remove('visible'); }
          }
        });
      </script>
    ` : '';

    html = html.replace('</body>', `${floatingContactHtml}${footerBrand}</body>`);

    const mapUrl = data.address ? `https://maps.google.com/maps?q=${encodeURIComponent(data.address)}&t=&z=13&ie=UTF8&iwloc=&output=embed` : '';
    const mapCode = (data.showMap && mapUrl) ? `<div class="overflow-hidden rounded-[2rem] mt-6 map-container ux-glass"><iframe src="${mapUrl}" width="100%" height="240" style="border:0;" loading="lazy"></iframe></div>` : '';
    replaceAll('[[MAP_AREA]]', mapCode);

    let reviewsAndPhotosHtml = '';

    if (data.showReviews && data.reviews && data.reviews.length > 0) {
      let reviewsHtml = `<section id="avaliacoes" class="py-24 px-6 w-full"><div class="max-w-7xl mx-auto"><div class="text-center mb-16"><h2 class="text-4xl font-black mb-4">O que dizem sobre nós</h2><div class="flex justify-center gap-1 text-yellow-500 text-2xl mb-4">★★★★★</div><p class="opacity-70 max-w-2xl mx-auto">Avaliações reais de clientes no Google</p></div><div class="grid md:grid-cols-3 gap-8">`;
      data.reviews.slice(0, 3).forEach((r, idx) => {
        let stars = '★'.repeat(Math.round(r.rating || 5)) + '☆'.repeat(5 - Math.round(r.rating || 5));
        const isLongText = r.text && r.text.length > 150;
        const textCssId = `review-text-${idx}`;
        const inputCssId = `toggle-review-${idx}`;

        let textHtml = `<p style="font-size: 0.875rem; opacity: 0.8; font-style: italic; flex: 1; line-height: 1.6; margin-bottom: 0;" class="${isLongText ? textCssId : ''}">"${r.text}"</p>`;
        if (isLongText) {
          textHtml = `
            <style>
              .${textCssId} { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; transition: all 0.3s ease; }
              #${inputCssId}:checked ~ .${textCssId} { -webkit-line-clamp: unset; }
              #${inputCssId}:checked ~ .review-label-${idx}::after { content: 'Ler menos'; }
              #${inputCssId}:not(:checked) ~ .review-label-${idx}::after { content: 'Ler mais'; }
            </style>
            <input type="checkbox" id="${inputCssId}" style="display: none;">
            ${textHtml}
            <label for="${inputCssId}" class="review-label-${idx}" style="cursor: pointer; color: ${colors.c5}; font-size: 0.75rem; font-weight: bold; text-decoration: underline; margin-top: 0.5rem; display: inline-block;"></label>
            `;
        }

        reviewsHtml += `<div class="p-8 rounded-3xl" style="background: ${colors.c2}; border: 1px solid ${colors.c3}; display: flex; flex-direction: column; gap: 1rem; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.05);"><div style="display: flex; align-items: center; gap: 1rem;"><img src="${r.profile_photo_url || 'https://via.placeholder.com/50'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;"/><div style="text-align: left;"><h4 style="font-weight: 800; color: ${colors.c4}; font-size: 0.95rem; margin-bottom: 2px;">${r.author_name}</h4><div style="color: #EAB308; font-size: 0.75rem; letter-spacing: 0.1em;">${stars}</div></div><svg width="24" height="24" viewBox="0 0 24 24" style="position: absolute; top: 24px; right: 24px; opacity: 0.1;" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg></div>${textHtml}<span style="font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.4; margin-top: auto;">${r.relative_time_description}</span></div>`;
      });
      reviewsHtml += `</div></div></section>`;
      reviewsAndPhotosHtml += reviewsHtml;
    }

    if (data.googlePhotos && data.googlePhotos.length > 0) {
      let photosHtml = `<section id="galeria" class="py-24 overflow-hidden w-full"><div class="max-w-7xl mx-auto px-6 text-center mb-16"><h2 class="text-4xl font-black mb-4">Nossa Galeria</h2><div class="w-20 h-2 mx-auto rounded-full mb-4" style="background-color: ${colors.c5};"></div><p class="opacity-70 max-w-2xl mx-auto">Conheça nosso espaço e trabalho em detalhes</p></div>`;
      photosHtml += `<div class="relative w-full overflow-hidden" style="display: flex; gap: 20px; white-space: nowrap;">`;
      photosHtml += `<style>
         @keyframes scroll-gallery { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-320px * ${Math.max(1, data.googlePhotos.length)})); } }
         .gallery-track { display: flex; gap: 20px; animation: scroll-gallery ${Math.max(20, data.googlePhotos.length * 5)}s linear infinite; width: max-content; }
         .gallery-track:hover { animation-play-state: paused; }
         .gallery-img-container { width: 300px; height: 300px; border-radius: 20px; overflow: hidden; flex-shrink: 0; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 2px solid opacity-20; }
         .gallery-img-container img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
         .gallery-img-container:hover img { transform: scale(1.1); }
      </style>`;
      photosHtml += `<div class="gallery-track">`;
      const renderPhotos = () => data.googlePhotos.map((url: string) => `<div class="gallery-img-container" style="border-color: ${colors.c3}"><img src="${url}" loading="lazy" alt="Galeria"/></div>`).join('');
      photosHtml += renderPhotos() + renderPhotos();
      photosHtml += `</div></section>`;

      reviewsAndPhotosHtml += photosHtml;
    }

    replaceAll('[[REVIEWS_AREA]]', reviewsAndPhotosHtml);

    const formAction = data.email ? `action="https://formsubmit.co/ajax/${data.email}"` : '';
    const hiddenInputs = data.email ? `<input type="hidden" name="_subject" value="[Contato do seu Site] Nova mensagem de um cliente"><input type="hidden" name="_language" value="pt-BR"><input type="hidden" name="_template" value="box"><input type="hidden" name="_captcha" value="false">` : '';

    const formCode = data.showForm ? `
    <form id="sitecraft-contact-form" ${formAction} class="space-y-4 ux-form ux-glass p-8 md:p-12 rounded-[2rem] relative">
      ${hiddenInputs}
      <input name="Nome" required class="w-full bg-[${colors.c1}] border border-[${colors.c3}] rounded-xl p-4 text-sm focus:outline-none focus:border-[${colors.c4}] transition-all text-[${colors.c4}] placeholder:text-[${colors.c6}]" placeholder="Seu nome" />
      <input name="Email" type="email" required class="w-full bg-[${colors.c1}] border border-[${colors.c3}] rounded-xl p-4 text-sm focus:outline-none focus:border-[${colors.c4}] transition-all text-[${colors.c4}] placeholder:text-[${colors.c6}]" placeholder="Seu email" />
      <textarea name="Mensagem" required class="w-full bg-[${colors.c1}] border border-[${colors.c3}] rounded-xl p-4 text-sm focus:outline-none focus:border-[${colors.c4}] transition-all text-[${colors.c4}] placeholder:text-[${colors.c6}]" rows="4" placeholder="Sua mensagem"></textarea>
      <button type="${data.email ? 'submit' : 'button'}" class="btn-primary w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all text-[${colors.c1}]" style="background-color: ${colors.c7}; border: none;">Enviar mensagem</button>
    </form>
    <script id="contact-form-script">
      document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('sitecraft-contact-form');
        if (form && form.hasAttribute('action')) {
          form.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const btn = form.querySelector('button[type="submit"]');
            if(btn) { btn.innerText = 'Enviando...'; btn.style.opacity = '0.7'; btn.disabled = true; }
            fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) })
            .then(response => response.json())
            .then(data => { form.innerHTML = '<div style="text-align:center; padding: 20px; animation: fadeUp 0.5s ease;"><div style="width: 64px; height: 64px; background: rgba(16,185,129,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;"><i class="fas fa-check" style="font-size: 30px; color: #10b981;"></i></div><h3 style="font-size: 24px; font-weight: 900; color: ${colors.c4}; margin-bottom: 8px;">Enviado com sucesso!</h3><p style="font-size: 14px; color: ${colors.c6};">Agradecemos o seu contato. Retornaremos o mais breve possível.</p></div>'; })
            .catch(error => { if(btn) { btn.innerText = 'Erro ao enviar. Tente novamente.'; btn.style.opacity = '1'; btn.disabled = false; } });
          });
        }
      });
    </script>` : '';

    replaceAll('[[CONTACT_FORM]]', formCode);

    const imgPlaceholder = (id: string, label: string) => {
      if (customImages[id]) return `<div class="editable-image-wrapper w-full py-4"><div class="editable-image rounded-2xl flex flex-col items-center justify-center text-zinc-500 hover:text-emerald-500 transition-colors cursor-pointer w-full min-h-[320px] bg-black/20" data-id="${id}"><img src="${customImages[id]}" class="w-full h-full block object-contain" style="border-radius: inherit; margin: 0; box-shadow: none;" /></div></div>`;
      return `<div class="editable-image-wrapper w-full py-4"><div class="editable-image rounded-2xl flex flex-col items-center justify-center text-zinc-500 hover:text-emerald-500 transition-colors cursor-pointer w-full min-h-[320px] bg-black/20" data-id="${id}"><i class="fas fa-camera text-4xl mb-3"></i><span class="text-xs font-bold uppercase tracking-widest">Adicionar Imagem - ${label}</span></div></div>`;
    };

    replaceAll('[[HERO_IMAGE]]', imgPlaceholder('hero-img', 'Destaque (Topo)'));
    replaceAll('[[ABOUT_IMAGE]]', imgPlaceholder('about-img', 'Quem Somos'));

    return html.replace('</head>', `${headInjection}</head>`);
  };

  const handleAddCustomDomain = async () => {
    if (!customDomainInput) return showToast('Digite um domínio válido (ex: suamarca.com.br).', 'error');
    if (customDomainInput.includes('sitezing.com.br')) return showToast('Você não pode vincular o domínio oficial da plataforma.', 'error');

    setIsLinkingDomain(true);
    try {
      const linkFn = httpsCallable(functions, 'addCustomDomain');
      // Passamos o domínio base; o backend deve tratar o root e o www
      await linkFn({ projectId: currentProjectSlug, domain: customDomainInput });
      showToast('Domínio configurado! Verifique as instruções de apontamento.', 'success');
      // Força a recarga para refletir a nova URL na tela de Meus Projetos
      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);
    } catch (error: any) {
      if (error.message.includes('already-exists') || error.message.includes('já está em uso')) {
        showToast('Este domínio já está em uso por outro site.', 'error');
      } else {
        showToast('Erro ao vincular domínio: ' + error.message, 'error');
      }
    } finally {
      setIsLinkingDomain(false);
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setConfirmDialog({
      title: 'Desconectar Domínio',
      message: `Tem certeza que deseja remover o domínio ${domainToRemove}? Seu site voltará a usar o endereço temporário do sistema.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        showToast('Desconectando domínio...', 'info');
        try {
          const removeFn = httpsCallable(functions, 'removeCustomDomain');
          await removeFn({ projectId: currentProjectSlug, domain: domainToRemove });
          showToast('Domínio removido com sucesso.', 'success');

          const listFn = httpsCallable(functions, 'listUserProjects');
          const listRes: any = await listFn({});
          setSavedProjects(listRes.data?.projects || []);
        } catch (error: any) {
          showToast('Erro ao remover domínio: ' + error.message, 'error');
        }
      }
    });
  };

  const handleVerifyDomain = async (domainToVerify: string) => {
    setIsVerifyingDomain(true);
    try {
      const verifyFn = httpsCallable(functions, 'verifyDomainPropagation');
      const res: any = await verifyFn({ projectId: currentProjectSlug, domain: domainToVerify });
      if (res.data?.isPropagated) {
        showToast('Sucesso! Seu domínio já propagou e está ativo.', 'success');
      } else {
        showToast('Ainda aguardando propagação no provedor.', 'warning');
      }

      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);
    } catch (error: any) {
      showToast('Erro ao verificar: ' + error.message, 'error');
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleGenerate = async (forcedDescription?: string) => {
    if (!formData.businessName) return showToast('Preencha o Nome do Negócio para gerar!', 'error');
    setShowFloatModal(false);
    setIsGenerating(true);
    try {
      if (aiContent && generatedHtml) {
        const extractedImages = extractCustomImages(generatedHtml);
        setGeneratedHtml(renderTemplate(aiContent, formData, extractedImages));
        setHasUnsavedChanges(true);
        setIsGenerating(false);
        showToast('Layout atualizado com sucesso.', 'success');
        return;
      }
      console.log("Chamando generateSite...");
      const generateFn = httpsCallable(functions, 'generateSite');
      const result: any = await generateFn({
        businessName: formData.businessName,
        description: forcedDescription !== undefined ? forcedDescription : formData.description,
        region: formData.region,
        googleContext: formData.showReviews ? JSON.stringify({ summary: formData.editorialSummary, reviews: formData.reviews }) : ''
      });
      console.log("Resultado da IA recebido:", result.data ? "Sucesso (HTML presente)" : "Falha (Sem dados)");
      setAiContent(result.data);
      const extractedImages = extractCustomImages(generatedHtml);

      // Mesclar imagens geradas pela IA caso o usuário não tenha enviado as dele manualmente
      const mergedImages: Record<string, string> = { ...extractedImages };
      if (result.data.heroImage && !mergedImages['hero-img']) mergedImages['hero-img'] = result.data.heroImage;
      if (result.data.aboutImage && !mergedImages['about-img']) mergedImages['about-img'] = result.data.aboutImage;

      const outputHtml = renderTemplate(result.data, formData, mergedImages);
      console.log("Template renderizado, tamanho:", outputHtml?.length || 0);
      setGeneratedHtml(outputHtml);
      setHasUnsavedChanges(true);
      showToast('Site gerado com inteligência artificial!', 'success');
      nextGuideStep(1); // Passo 1: Minimizar para ver
      setTimeout(() => setIsSaveReminderOpen(true), 1500); // 1.5s delay for dramatic effect
      setIsMenuOpen(false); // Fechar menu automaticamente para visualização imediata (mobile/desktop)
    } catch (error: any) {
      console.error("Erro Crítico na Geração:", error);
      showToast('Erro na geração: ' + error.message, 'error');
    }
    finally {
      console.log("Finalizando estado de geração.");
      setIsGenerating(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setFormData(p => ({ ...p, logoBase64: reader.result as string })); setHasUnsavedChanges(true); };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'OPEN_PLAN_MODAL') {
        setSelectedPlanModal(e.data.plan);
        setSelectedPriceId(e.data.priceId || null);
        setCheckoutTermsAccepted(false);
      }
      if (e.data?.type === 'OPEN_MAGIC_MODAL') {
        setShowFloatModal(true);
      }
      if (e.data?.type === 'OPEN_TRIAL_MODAL') {
        setIsTrialModalOpen(true);
      }
      if (e.data?.type === 'SET_BUSINESS_NAME') {
        handleFloatNameChange(e.data.value);
      }
      if (e.data?.type === 'SET_BUSINESS_DESC') {
        setFormData(p => ({ ...p, description: e.data.value }));
      }
      if (e.data?.type === 'SET_CUSTOM_SLUG') {
        handleCustomSlugChange(e.data.value);
      }
      if (e.data?.type === 'SUBMIT_CREATE') {
        if (!formData.businessName) return showToast('Digite o nome da sua empresa!', 'warning');
        if (floatDomainStatus.available === false) return showToast('Este endereço não está disponível.', 'warning');
        
        const desc = formData.description || `Uma empresa moderna e inovadora chamada ${formData.businessName}.`;
        handleGenerate(desc);
        setIsMenuOpen(true);
        setActiveTab('geral');
      }
      if (e.data?.type === 'SYNC_FORM_DATA') {
        const d = e.data.data;
        const currentSlug = formData.customSlug;
        
        setFormData(p => ({
          ...p,
          businessName: d.businessName !== undefined ? d.businessName : p.businessName,
          description: d.description !== undefined ? d.description : p.description,
          customSlug: d.customSlug !== undefined ? d.customSlug : p.customSlug,
          googleSearchQuery: d.googleSearch !== undefined ? d.googleSearch : p.googleSearchQuery
        }));

        // Real-time Domain Validation
        if (d.customSlug !== undefined && d.customSlug !== currentSlug) {
           handleCustomSlugChange(d.customSlug);
        }
      }
      if (e.data?.type === 'TRIGGER_FETCH_GOOGLE') {
        fetchGoogleData(false, e.data.value);
      }
      if (e.data?.type === 'ACTION_CONFIRM_GOOGLE') {
        confirmGoogleInjection();
      }
      if (e.data?.type === 'ACTION_RESET_GOOGLE') {
        setPendingGoogleData(null);
        setGoogleStatus(null);
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'RESET_SEARCH_UI' }, '*');
        }
      }
      if (e.data?.type === 'ACTION_INSTANT_GENERATE') {
        if (!e.data.value) return showToast('Coloque o link do Google!', 'warning');
        setFormData(p => ({ ...p, googlePlaceUrl: e.data.value, businessName: e.data.name || p.businessName }));
        fetchGoogleData(true, e.data.value);
      }
      if (e.data?.type === 'ACTION_START_MAGIC') {
        if (!formData.businessName) return showToast('Digite o nome da sua empresa!', 'warning');
        if (floatDomainStatus.available === false) return showToast('Este endereço não está disponível.', 'warning');

        const desc = formData.description || `Uma empresa moderna e inovadora chamada ${formData.businessName}.`;
        handleGenerate(desc);
        setIsMenuOpen(true);
        setActiveTab('geral');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [formData.businessName, formData.description, floatDomainStatus.available, formData.googlePlaceUrl, handleGenerate, setIsMenuOpen, setActiveTab, fetchGoogleData, confirmGoogleInjection, setPendingGoogleData]);

  const handlePublishSite = async () => {
    const podePublicar = typeof generatedHtml === 'string' && generatedHtml.trim().length > 0;
    if (!podePublicar) {
      return showToast('O projeto está vazio! Você precisa gerar o conteúdo do site antes de publicá-lo.', 'warning');
    }

    let targetSlugForPublish = currentProjectSlug;
    if (!currentProjectSlug || hasUnsavedChanges) {
      showToast('Salvando últimas alterações...', 'info');
      const savedSlug = await handleSaveOrUpdateSite();
      if (!savedSlug) return; // Aborta publicação se falhar
      if (typeof savedSlug === 'string') targetSlugForPublish = savedSlug;
    }

    if (!targetSlugForPublish) {
      return showToast('Erro interno: ID do projeto não encontrado após salvar.', 'error');
    }

    // VERIFICAÇÃO DE IDENTIDADE (KYC)
    const hasFullKyc = userProfile && userProfile.fullName && userProfile.document && userProfile.phone && userProfile.address;
    if (!hasFullKyc) {
      showToast('Preencha as informações do perfil para poder publicar.', 'info');
      setIsProfileModalOpen(true);
      return;
    }

    setIsPublishing(true);
    try {
      const project = savedProjects.find(p => p.id === targetSlugForPublish);
      const isAlreadyPublished = Boolean(project?.publishUrl || project?.status === 'active' || project?.status === 'published');
      setIsUpdatePublish(isAlreadyPublished);

      const publishFn = httpsCallable(functions, 'publishUserProject');
      const res: any = await publishFn({ targetId: targetSlugForPublish });

      let publicUrl = res.data?.publishUrl;
      if (publicUrl && !publicUrl.startsWith('http')) publicUrl = `https://${publicUrl}`;

      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);

      setPublishModalUrl(publicUrl);
      showToast(isAlreadyPublished ? 'Atualização no ar! Seu site foi atualizado com sucesso.' : 'Site Publicado! Acesse: ' + publicUrl, 'success');
      nextGuideStep(4); // Passo 4: Pagamento
    } catch (err: any) {
      const errMsg = err.message || '';
      console.error("[Deploy] Falha na Publicação:", err);

      if (err.code === 'unauthenticated' || errMsg.includes('Firebase Hosting Token')) {
        showToast('O servidor negou acesso (Credencial Cloud ausente). A publicação falhou!', 'error');
      } else if (errMsg.includes('violar nossas políticas')) {
        showToast('Ação bloqueada: O conteúdo do seu site violou as políticas de segurança.', 'error');
      } else if (err.code === 'permission-denied' || errMsg.includes('expirou') || errMsg.includes('pagamento') || errMsg.includes('congelado')) {
        showToast('Seu período de teste expirou ou o site está congelado. Escolha um plano para manter seu site online!', 'warning');
        setActiveTab('assinatura');
        setIsMenuOpen(true);
      } else {
        showToast('Erro ao publicar: ' + errMsg, 'error');
      }
    }
    finally { setIsPublishing(false); }
  };

  const handleDeleteSite = async (projectId: string) => {
    setConfirmDialog({
      title: 'Excluir Projeto',
      message: 'Atenção! Esta ação apagará definitivamente o seu site do ar. Tem certeza absoluta?',
      onConfirm: async () => {
        try {
          const deleteFn = httpsCallable(functions, 'deleteUserProject');
          await deleteFn({ targetId: projectId });
          showToast("Site excluído com sucesso.", "success");
          if (projectId === currentProjectSlug) {
            setGeneratedHtml(null); setCurrentProjectSlug(null); setHasUnsavedChanges(false); setActiveTab('geral');
            setFormData({ businessName: '', description: '', region: '', whatsapp: '', instagram: '', facebook: '', linkedin: '', tiktok: '', youtube: '', x: '', rappi: '', zeDelivery: '', directLink: '', directLinkLabel: '', faviconBase64: '', seoDescription: '', isSeoDescriptionEdited: false, ifood: '', noveNove: '', keeta: '', phone: '', email: '', address: '', showMap: true, showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa', logoBase64: '', logoSize: 40, segment: '', googlePlaceUrl: '', showReviews: false, reviews: [], editorialSummary: '', customSlug: '', isCustomSlugEdited: false, googlePhotos: [], headerLayout: 'logo_left_icons_right', manualCss: '' });
          }

          const listFn = httpsCallable(functions, 'listUserProjects');
          const listRes: any = await listFn({});
          setSavedProjects(listRes.data?.projects || []);
        } catch (error) { showToast("Erro ao excluir o site.", "error"); }
        setConfirmDialog(null);
      }
    });
  };

  const handleStripeCheckout = async (projectId: string, planType: string, priceId?: string) => {
    if (!projectId) return;
    setCheckoutLoading(`${projectId}-${planType}`);
    try {
      const createCheckoutFn = httpsCallable(functions, 'createStripeCheckoutSession');
      const res: any = await createCheckoutFn({
        projectId,
        origin: window.location.origin,
        planType,
        priceId: priceId || selectedPriceId
      });
      if (res.data?.url) { window.location.href = res.data.url; return; }
      throw new Error('URL de checkout inválida.');
    } catch (error: any) { showToast('Erro ao iniciar pagamento.', 'error'); }
    finally { setCheckoutLoading(null); }
  };

  const handleConfirmCancel = async (projectId: string) => {
    setIsCanceling(true);
    try {
      const cancelFn = httpsCallable(functions, 'cancelStripeSubscription');
      await cancelFn({ projectId });
      showToast("Assinatura programada para cancelamento.", "success");

      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);

      setCancelModalProject(null);
    } catch (error: any) { showToast("Erro ao cancelar: " + error.message, "error"); }
    finally { setIsCanceling(false); }
  };

  const handleResumeSubscription = async (projectId: string) => {
    setIsResuming(true);
    try {
      const resumeFn = httpsCallable(functions, 'resumeStripeSubscription');
      await resumeFn({ projectId });
      showToast("Assinatura reativada com sucesso!", "success");

      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);
    } catch (error: any) {
      showToast("Erro ao reativar: " + error.message, "error");
    } finally {
      setIsResuming(false);
    }
  };

  const handleLoadProject = (project: any) => {
    if (!project) return;
    setFormData((prev) => ({ ...prev, ...(project.formData || {}) }));
    setAiContent(project.aiContent || null);
    setGeneratedHtml(cleanHtmlForPublishing(project.generatedHtml));
    setCurrentProjectSlug(project.projectSlug || project.id || null);
    setOfficialDomain(project.officialDomain || '');
    setRegisterLater(project.officialDomain === 'Pendente');
    setHasUnsavedChanges(false);
    setActiveTab('geral');

    if (window.innerWidth < 768) {
      setIsMenuOpen(false); // Se for celular, já fecha o menu para mostrar o site carregado
    }

    // Lembrete Persuasivo para Publicação de Rascunhos
    if (!project.publishUrl && project.status !== 'published') {
      setTimeout(() => {
        showToast('📍 Lembrete: Este projeto ainda é um rascunho. Preencha os dados e clique em Publicar para colocá-lo no ar!', 'info');
      }, 1000);
    }
  };

  useEffect(() => {
    if (loggedUserEmail && pendingSave) {
      setPendingSave(false);
      handleSaveOrUpdateSite();
    }
  }, [loggedUserEmail, pendingSave]);

  const handleLogout = async () => {
    await signOut(auth);
    setSavedProjects([]); setCurrentProjectSlug(null); setGeneratedHtml(null);
    showToast('Você saiu da conta.', 'info');
  };

  const handleLoginSubmit = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Bem-vindo de volta!', 'success');
    } catch {
      await createUserWithEmailAndPassword(auth, email, password);
      showToast('Conta criada com sucesso!', 'success');
    }
    setIsLoginOpen(false);
  };

  const handleProfileSubmit = async (data: any) => {
    try {
      showToast('Salvando e validando identidade...', 'info');
      const updateProfileFn = httpsCallable(functions, 'updateUserProfile');
      await updateProfileFn(data);
      setUserProfile((prev: any) => ({ ...prev, ...data, kycCompleted: true }));
      setIsProfileModalOpen(false);

      // Auto-resume publication if we have a currentProjectSlug context
      if (currentProjectSlug) {
        showToast('Identidade verificada! Retomando publicação...', 'success');
        // Use setTimeout to allow React state to flush
        setTimeout(() => handlePublishSite(), 500);
      } else {
        showToast('Perfil atualizado com sucesso!', 'success');
      }
    } catch (error: any) {
      throw error;
    }
  };




  const renderMobileBottomSheet = () => {
    if (!activeMobileSheet) return null;

    const sheetCategories = [
      { id: 'dashboard', title: 'Painel', icon: <LayoutDashboard size={14} /> },
      { id: 'visual', title: 'Visual', icon: <Palette size={14} /> },
      { id: 'social', title: 'Redes', icon: <Instagram size={14} /> },
      { id: 'delivery', title: 'Delivery', icon: <Rocket size={14} /> },
      { id: 'contato', title: 'Contato', icon: <Phone size={14} /> },
      { id: 'plano', title: 'Plano', icon: <CreditCard size={14} /> },
    ];

    return (
      <AnimatePresence>
        {activeMobileSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveMobileSheet(null)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[150]"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[160] bg-white rounded-t-[2.5rem] max-h-[88vh] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.15)] ring-1 ring-stone-200"
            >
              {/* Handle Bar */}
              <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" onClick={() => setActiveMobileSheet(null)}>
                <div className="w-12 h-1.5 bg-stone-200 rounded-full" />
              </div>

              {/* Title & Navigation Chips */}
              <div className="px-6 py-2">
                <div className="flex items-center justify-between mb-3 pt-1">
                  <h3 className="text-xs font-black text-stone-950 uppercase tracking-tight italic">Configuração do Site</h3>
                  <button onClick={() => setActiveMobileSheet(null)} className="text-stone-400 p-1">
                    <X size={16} />
                  </button>
                </div>

                {/* Navigation Chips (Google Style) */}
                <div 
                  ref={ribbonNavRef}
                  onMouseDown={handleRibbonMouseDown}
                  onMouseLeave={handleRibbonMouseLeave}
                  onMouseUp={handleRibbonMouseUp}
                  onMouseMove={handleRibbonMouseMove}
                  className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2 mask-linear-right cursor-grab active:cursor-grabbing select-none"
                >
                  {sheetCategories.map(c => {
                    const isActive = activeMobileSheet === c.id;
                    const isDisabled = !generatedHtml && c.id !== 'dashboard';
                    return (
                      <button
                        key={c.id}
                        onClick={() => !isDisabled && setActiveMobileSheet(c.id)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${isActive ? 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/20' : 'bg-stone-50 text-stone-500 border-stone-100 hover:border-stone-300'} ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        {c.icon}
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div className="p-6 overflow-y-auto pb-32 space-y-8 flex-1">
                {/* ID: dashboard */}
                {activeMobileSheet === 'dashboard' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Seus Projetos</h4>
                      {loggedUserEmail && <button onClick={handleLogout} className="text-[10px] font-bold text-red-500">Sair da Conta</button>}
                    </div>
                    {!loggedUserEmail ? (
                      <div className="bg-stone-50 rounded-2xl p-8 border border-stone-100 text-center">
                        <p className="text-xs text-stone-500 font-bold mb-4">Faça login para ver seus sites.</p>
                        <button onClick={() => { setIsLoginOpen(true); setActiveMobileSheet(null); }} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">Fazer Login</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedProjects.length === 0 ? (
                          <p className="text-[10px] text-stone-400 italic text-center py-6">Nenhum site encontrado.</p>
                        ) : (
                          savedProjects.map(p => (
                            <div
                              key={p.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => { handleLoadProject(p); setActiveMobileSheet(null); }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleLoadProject(p); setActiveMobileSheet(null); } }}
                              className={`flex items-center gap-3 bg-stone-50 border border-stone-200 p-3 rounded-2xl cursor-pointer ${currentProjectSlug === p.id ? 'ring-2 ring-indigo-500' : ''}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="text-xs font-bold text-stone-800 truncate">{p.businessName || 'Sem título'}</p>
                                  {getStatusBadge(p)}
                                </div>
                                <p className="text-[9px] font-mono text-stone-400 truncate mt-1">{p.publishUrl?.replace('https://', '') || 'Rascunho'}</p>
                              </div>
                              <ChevronRight size={14} className="text-stone-400" />
                            </div>
                          ))
                        )}
                        <div className="pt-4 border-t border-stone-100 text-center">
                          <button onClick={() => { window.location.reload(); }} className="text-[10px] font-black text-indigo-600 uppercase">+ Criar Novo</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ID: visual */}
                {activeMobileSheet === 'visual' && (
                  <div className="space-y-6">
                    {/* SINCRONIZAR GOOGLE (MOVIDO PARA O TOPO PARA MÁXIMA VISIBILIDADE) */}
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-[2.5rem] shadow-sm mb-2">
                      <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block flex items-center justify-center gap-2"><Sparkles size={14} className="text-blue-500" /> Sincronizar com Google</label>
                      <div className="space-y-3">
                        <input 
                          className="w-full bg-white border border-blue-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-blue-500 shadow-sm" 
                          placeholder="Link da sua empresa no Google" 
                          value={formData.googlePlaceUrl} 
                          onChange={e => { setFormData({ ...formData, googlePlaceUrl: e.target.value }); setHasUnsavedChanges(true) }} 
                        />
                        <button 
                          onClick={() => fetchGoogleData(false)}
                          disabled={isFetchingGoogle || !formData.googlePlaceUrl}
                          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-stone-300 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                          {isFetchingGoogle ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>GOOGLE <Zap size={14} fill="currentColor" /></>}
                        </button>
                      </div>

                      {googleStatus && (
                        <div className={`text-[10px] font-bold p-3 rounded-xl mt-3 flex items-center gap-2 ${googleStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                          {googleStatus.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          {googleStatus.msg}
                        </div>
                      )}

                      {pendingGoogleData && (
                        <div className="bg-white border-2 border-blue-400 rounded-2xl p-4 shadow-2xl animate-up mt-4 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-10"><Zap size={40} className="text-blue-600" /></div>
                          <div className="flex items-center gap-3 mb-4 relative z-10 text-left">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner"><CheckCircle size={24} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Empresa Localizada!</p>
                              <p className="text-xs font-black text-stone-900 truncate leading-tight uppercase italic">{pendingGoogleData.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 relative z-10">
                            <button onClick={() => setPendingGoogleData(null)} className="flex-1 py-3 bg-stone-100 text-stone-500 rounded-xl text-[10px] uppercase font-black hover:bg-stone-200 transition-colors">Ignorar</button>
                            <button onClick={confirmGoogleInjection} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-[10px] uppercase font-black shadow-lg shadow-blue-600/30 active:scale-95 transition-all">Importar Agora ✨</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Nome do Seu Negócio</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm font-bold text-stone-800 outline-none" placeholder="Ex: Pizzaria do Zé" value={formData.businessName} onChange={e => handleFloatNameChange(e.target.value)} />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Descrição do Site (Geral)</label>
                      <textarea className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-800 h-24 outline-none resize-none font-medium leading-relaxed" placeholder="Ex: Somos uma pizzaria..." value={formData.description} onChange={e => handleDescriptionSync(e.target.value)} />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">Descrição para o Google (SEO)</label>
                      <textarea className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-stone-800 h-20 outline-none resize-none font-medium leading-relaxed" placeholder="Resumo curto para aparecer nas buscas..." value={formData.seoDescription} onChange={e => { setFormData({ ...formData, seoDescription: e.target.value, isSeoDescriptionEdited: true }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Modelo</label>
                        <select value={formData.layoutStyle} onChange={(e) => { setFormData({ ...formData, layoutStyle: e.target.value }); setHasUnsavedChanges(true); }} className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-bold text-stone-800 appearance-none outline-none">
                          {LAYOUT_STYLES.map(s => (<option key={s.id} value={s.id}>{s.label}</option>))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Logo</label>
                        <label className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-bold text-stone-600 flex items-center justify-center gap-2 cursor-pointer">
                          {formData.logoBase64 ? <Check size={14} className="text-teal-500" /> : <Upload size={14} />}
                          {formData.logoBase64 ? 'Alterar' : 'Subir'}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Favicon</label>
                        <label className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-bold text-stone-600 flex items-center justify-center gap-2 cursor-pointer">
                          {formData.faviconBase64 ? <Check size={14} className="text-teal-500" /> : <Upload size={14} />}
                          {formData.faviconBase64 ? 'Alterar' : 'Subir'}
                          <input type="file" accept="image/*" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onload = (event) => { setFormData({ ...formData, faviconBase64: event.target?.result as string }); setHasUnsavedChanges(true); };
                               reader.readAsDataURL(file);
                             }
                          }} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Cores do Site</label>
                      <div className="grid grid-cols-5 gap-2">
                        {COLORS.slice(0, 10).map(c => (
                          <button key={c.id} onClick={() => { setFormData({ ...formData, colorId: c.id }); setHasUnsavedChanges(true); }} className={`w-full aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${formData.colorId === c.id ? 'border-teal-500 scale-110 shadow-lg' : 'border-transparent bg-stone-50'}`} style={{ backgroundColor: c.c1 }}>
                            {formData.colorId === c.id && <Check size={14} className="text-white drop-shadow-md" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-stone-100">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Domínio Temporário</label>
                      <div className="flex bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                        <input className="flex-1 bg-transparent px-3 py-3 text-sm font-mono font-bold text-teal-600 outline-none w-full text-right" placeholder="meu-site" value={formData.customSlug} onChange={e => handleCustomSlugChange(e.target.value)} />
                        <span className="bg-stone-100 px-3 py-3 text-[9px] font-bold text-stone-400 flex items-center">.sitezing.com.br</span>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex flex-col gap-3">
                      <button 
                        onClick={() => { setActiveMobileSheet('social'); handleSaveOrUpdateSite(); }}
                        className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                      >
                        Próximo: Redes Sociais <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ID: social */}
                {activeMobileSheet === 'social' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Link do Google Business</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-blue-500" placeholder="Link da página no Google" value={formData.googlePlaceUrl} onChange={e => { setFormData({ ...formData, googlePlaceUrl: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Instagram</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-pink-500" placeholder="@usuario ou Link" value={formData.instagram} onChange={e => { setFormData({ ...formData, instagram: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Facebook</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-blue-600" placeholder="Link da Página" value={formData.facebook} onChange={e => { setFormData({ ...formData, facebook: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">TikTok</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-black" placeholder="@usuario ou Link" value={formData.tiktok} onChange={e => { setFormData({ ...formData, tiktok: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">YouTube</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-red-600" placeholder="Link do Canal" value={formData.youtube} onChange={e => { setFormData({ ...formData, youtube: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">X / Twitter</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-stone-900" placeholder="@usuario ou Link" value={formData.x} onChange={e => { setFormData({ ...formData, x: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex flex-col gap-3">
                      <button 
                        onClick={() => { setActiveMobileSheet('delivery'); handleSaveOrUpdateSite(); }}
                        className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                      >
                        Próximo: Delivery <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ID: delivery */}
                {activeMobileSheet === 'delivery' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl mb-2">
                      <p className="text-[11px] text-orange-800 font-medium">Configure seus canais de venda direta. Os botões aparecerão automaticamente em seu site.</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 block">iFood</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-orange-500" placeholder="Link da loja no iFood" value={formData.ifood} onChange={e => { setFormData({ ...formData, ifood: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 block">Rappi</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-orange-600" placeholder="Link do Rappi" value={formData.rappi} onChange={e => { setFormData({ ...formData, rappi: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2 block">Zé Delivery</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-yellow-500" placeholder="Link do Zé Delivery" value={formData.zeDelivery} onChange={e => { setFormData({ ...formData, zeDelivery: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 block">Keeta</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-emerald-500 font-bold" placeholder="Link da loja no Keeta" value={formData.keeta} onChange={e => { setFormData({ ...formData, keeta: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Link Personalizado (Agenda, Cardápio, etc)</label>
                      <div className="space-y-2">
                        <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-blue-500 font-bold" placeholder="Nome do Botão (Ex: Ver Agenda)" value={formData.directLinkLabel} onChange={e => { setFormData({ ...formData, directLinkLabel: e.target.value }); setHasUnsavedChanges(true) }} />
                        <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-blue-500" placeholder="Link (URL Completa)" value={formData.directLink} onChange={e => { setFormData({ ...formData, directLink: e.target.value }); setHasUnsavedChanges(true) }} />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex flex-col gap-3">
                      <button 
                        onClick={() => { setActiveMobileSheet('contato'); handleSaveOrUpdateSite(); }}
                        className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                      >
                        Próximo: Contato <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ID: contato */}
                {activeMobileSheet === 'contato' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">WhatsApp de Atendimento</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-emerald-500" placeholder="DDD + Número" value={formData.whatsapp} onChange={e => { setFormData({ ...formData, whatsapp: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Telefone / Fixo</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-teal-500" placeholder="Número de contato" value={formData.phone} onChange={e => { setFormData({ ...formData, phone: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">E-mail</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-teal-500" placeholder="Ex: contato@suaempresa.com" value={formData.email} onChange={e => { setFormData({ ...formData, email: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div className="pt-4 border-t border-stone-100">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Endereço Físico</label>
                      <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-teal-500" placeholder="Rua, Número, Bairro - Cidade" value={formData.address} onChange={e => { setFormData({ ...formData, address: e.target.value }); setHasUnsavedChanges(true) }} />
                    </div>
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-[11px] font-black text-stone-800 uppercase">Exibir Mapa no Site</span>
                      <div onClick={() => { setFormData({ ...formData, showMap: !formData.showMap }); setHasUnsavedChanges(true); }} className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${formData.showMap ? 'bg-teal-500' : 'bg-stone-300'}`}>
                        <motion.div animate={{ x: formData.showMap ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex flex-col gap-4">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                         <p className="text-[11px] font-black text-emerald-800 uppercase text-center">Tudo Pronto! 🎉</p>
                         <p className="text-[10px] text-emerald-600 font-medium text-center mt-1">Suas configurações básicas foram concluídas. Você pode assinar um plano para publicar agora.</p>
                      </div>
                      <button 
                        onClick={() => { setActiveMobileSheet('plano'); handleSaveOrUpdateSite(); }}
                        className="w-full min-h-[56px] bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                      >
                        Finalizar e Ver Planos <CheckCircle size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ID: plano */}
                {activeMobileSheet === 'plano' && (() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  const expirationDate = currentProject?.expiresAt ? getExpirationTimestampMs(currentProject.expiresAt) : null;
                  const daysLeft = expirationDate ? Math.ceil((expirationDate - Date.now()) / (1000 * 3600 * 24)) : 0;
                  const isPaid = currentProject?.paymentStatus === 'paid';
                  const isCanceled = currentProject?.cancelAtPeriodEnd === true || currentProject?.subscriptionStatus === 'canceled';
                  let isExpired = false;
                  if (expirationDate && expirationDate < Date.now() && !isPaid) {
                    isExpired = true;
                  }
                  const needsPayment = currentProject?.status === 'frozen' || isExpired;

                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center text-center space-y-2 mb-6">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-2">
                          <CreditCard size={24} />
                        </div>
                        <h4 className="text-sm font-black text-stone-900 uppercase">Assinatura</h4>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                          {isPaid ? (isCanceled ? 'Assinatura Cancelada' : 'Plano Operacional') : 'Ativação imediata após o pagamento'}
                        </p>
                      </div>

                      <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 mb-6 shadow-inner">
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Resumo</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                            <span className="text-xs text-stone-500 font-medium">Status</span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${daysLeft > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {daysLeft > 0 ? 'Online (Ativo)' : 'Offline (Congelado)'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                            <span className="text-xs text-stone-500 font-medium">Plano</span>
                            <span className="text-xs font-bold text-stone-800 text-right">
                              {isPaid ? (isCanceled ? 'Cancelada' : `${currentProject?.planSelected || 'Ativo'}`) : 'Teste Gratuito'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-stone-500 font-medium">{isPaid ? 'Renovação' : 'Vencimento'}</span>
                            <span className="text-xs font-bold text-stone-800 text-right">
                              {!isPaid && daysLeft > 0 && `Faltam ${daysLeft} dias`}
                              {!isPaid && daysLeft <= 0 && `Encerrado`}
                              {isPaid && !isCanceled && expirationDate && `${new Date(expirationDate).toLocaleDateString('pt-BR')}`}
                              {isPaid && isCanceled && expirationDate && `No ar até ${new Date(expirationDate).toLocaleDateString('pt-BR')}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isPaid && isCanceled && daysLeft > 0 ? (
                        <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl text-center space-y-4">
                          <h4 className="font-black text-orange-700 text-sm uppercase tracking-wider">Assinatura Cancelada</h4>
                          <p className="text-[11px] text-orange-600/80 mb-2">Seu site continuará no ar até o cumprimento total do período pago.</p>
                          <button
                            onClick={() => handleResumeSubscription(currentProjectSlug)}
                            disabled={isResuming}
                            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase w-full"
                          >
                            {isResuming ? <Loader2 className="animate-spin inline mr-2" /> : 'Reativar Assinatura'}
                          </button>
                        </div>
                      ) : isPaid && !isCanceled ? (
                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center space-y-4">
                          <h4 className="font-black text-emerald-700 text-sm uppercase tracking-wider">Plano Operacional</h4>
                          <div className="pt-2">
                            <button
                              onClick={() => { setIsPlansBannerOpen(true); setActiveMobileSheet(null); setIsMobileWizardOpen(false); }}
                              className="bg-white border border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl text-xs font-bold w-full uppercase shadow-sm"
                            >
                              Mudar de Plano
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-center mb-2">Opções Disponíveis</p>
                          {platformConfigs?.plans?.map((p: any) => {
                            const isAnual = p.interval === 'year';
                            return (
                              <button
                                key={p.priceId}
                                onClick={() => {
                                  if (currentProject?.stripeSubscriptionId && currentProject?.cancelAtPeriodEnd && currentProject?.status !== 'frozen') {
                                    handleResumeSubscription(currentProjectSlug);
                                  } else {
                                    setCheckoutDetailsModal({ projectId: currentProjectSlug || '', planType: p.name, priceId: p.priceId });
                                    setActiveMobileSheet(null);
                                    setIsMobileWizardOpen(false);
                                  }
                                }}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-95 ${isAnual ? 'border-orange-500 bg-orange-50/30' : 'border-stone-100 bg-stone-50'}`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${isAnual ? 'text-orange-600' : 'text-stone-400'}`}>{p.name}</span>
                                  {isAnual && <span className="bg-orange-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Melhor Oferta</span>}
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-black text-stone-900">R$ {p.price}</span>
                                  <span className="text-[9px] text-stone-400 font-bold">/ {p.interval === 'month' ? 'mês' : (p.interval === 'year' ? 'ano' : p.interval)}</span>
                                </div>
                                <p className="text-[9px] text-stone-400 mt-2 font-medium">{p.description || 'Hospedagem profissional SiteZing'}</p>
                              </button>
                            );
                          })}

                          {(!platformConfigs?.plans || platformConfigs.plans.length === 0) && (
                            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                              <p className="text-[10px] text-stone-400 font-bold italic">Carregando opções de planos...</p>
                            </div>
                          )}

                          <div className="pt-6 border-t border-stone-100 mt-6">
                            <div className="bg-teal-50 rounded-xl p-4 flex items-center gap-3">
                              <ShieldCheck size={20} className="text-teal-600" />
                              <div className="flex-1">
                                <p className="text-[10px] font-black text-teal-800 uppercase">Pagamento Seguro</p>
                                <p className="text-[9px] text-teal-600 font-medium">Processado via Stripe com proteção total.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  const renderMobileBottomNav = () => (
    <MobileBottomNav
      isMobile={isMobile}
      canPublish={Boolean(generatedHtml)}
      isPublishing={isPublishing}
      isSavingProject={isSavingProject}
      isMobileWizardOpen={isMobileWizardOpen}
      activeMobileSheet={activeMobileSheet}
      setIsMobileWizardOpen={setIsMobileWizardOpen}
      setActiveMobileSheet={setActiveMobileSheet}
      onPublish={handlePublishSite}
      onWarnMissingSite={() => showToast('Gere o site antes de publicar.', 'info')}
      generatedHtml={generatedHtml}
      loggedUserEmail={loggedUserEmail}
      onLogin={() => setIsLoginOpen(true)}
      onLogout={handleLogout}
    />
  );



  const getStatusBadge = (project: any) => {
    if (!project) return null;
    
    // SITE BLOQUEADO / CONGELADO
    if (project.status === 'frozen') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 rounded-full shadow-lg shadow-red-500/5 transition-all">
          <AlertCircle size={10} className="animate-pulse" /> SITE BLOQUEADO
        </span>
      );
    }

    // PLANO ATIVO / PUBLICADO
    if (project.paymentStatus === 'paid' || project.status === 'published' || project.status === 'active') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 rounded-full shadow-lg shadow-emerald-500/5">
          <CheckCircle size={10} /> PLANO ATIVO
        </span>
      );
    }

    // TESTE GRÁTIS / TRIAL
    if (project.expiresAt) {
      const expirationDate = getExpirationTimestampMs(project.expiresAt);
      if (!expirationDate) return null;
      const daysLeft = Math.ceil((expirationDate - Date.now()) / (1000 * 3600 * 24));

      if (daysLeft <= 0) {
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 rounded-full shadow-lg shadow-red-500/5">
            <AlertCircle size={10} /> TESTE EXPIRADO
          </span>
        );
      }

      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-orange-500/20 rounded-full shadow-lg shadow-orange-500/5 animate-pulse">
          <Clock size={10} /> TESTE GRÁTIS ({daysLeft}d)
        </span>
      );
    }

    // RASCUNHO (Fallback)
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-500/10 text-zinc-500 text-[10px] font-black uppercase tracking-widest border border-zinc-500/20 rounded-full">
        RASCUNHO
      </span>
    );
  };

  return (
    <GlobalErrorBoundary>
      <>
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Toast Notification (Substitui os alerts nativos) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-sm border backdrop-blur-md"
            style={{
              backgroundColor: toast.type === 'error' ? 'rgba(254, 242, 242, 0.95)' : toast.type === 'success' ? 'rgba(240, 253, 244, 0.95)' : toast.type === 'warning' ? 'rgba(255, 251, 235, 0.95)' : 'rgba(248, 250, 252, 0.95)',
              color: toast.type === 'error' ? '#991B1B' : toast.type === 'success' ? '#166534' : toast.type === 'warning' ? '#92400E' : '#334155',
              borderColor: toast.type === 'error' ? '#FCA5A5' : toast.type === 'success' ? '#86EFAC' : toast.type === 'warning' ? '#FCD34D' : '#E2E8F0'
            }}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'success' ? <CheckCircle size={18} /> : toast.type === 'warning' ? <AlertCircle size={18} /> : <Info size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal (Substitui o window.confirm) */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[300] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-black text-stone-900 mb-2 uppercase">{confirmDialog.title}</h2>
              <p className="text-sm text-stone-500 mb-6 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDialog(null)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-xl font-bold text-xs transition-colors">Cancelar</button>
                <button onClick={confirmDialog.onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-red-500/20 transition-colors">Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL AMPLO DE INSTRUÇÕES DNS */}
      <AnimatePresence>
        {isDnsModalOpen && currentProjectSlug && (() => {
          const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
          const domainRecords = currentProject?.domainRecords || [];
          return (
            <div className="fixed inset-0 z-[200] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white border border-stone-200 p-8 rounded-3xl shadow-2xl max-w-3xl w-full relative overflow-hidden"
              >
                <button onClick={() => setIsDnsModalOpen(false)} className="absolute top-6 right-6 text-stone-400 hover:text-stone-800 transition-colors bg-stone-100 p-2 rounded-full z-20">
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-100 p-3 rounded-xl"><Settings className="text-orange-600 w-6 h-6" /></div>
                  <div>
                    <h2 className="text-2xl font-black text-stone-900 uppercase">Apontamentos DNS</h2>
                    <p className="text-sm text-stone-500">Configure o domínio <span className="font-bold text-teal-600">{currentProject.officialDomain}</span></p>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6">
                  <p className="text-sm text-orange-800 leading-relaxed font-medium mb-4">
                    Acesse o painel do seu provedor de domínio (ex: Registro.br, HostGator, Locaweb) e procure pela opção <strong>"Editar Zona DNS"</strong>. Em seguida, adicione as linhas abaixo <strong>exatamente</strong> como são apresentadas.
                    <br /><span className="text-xs text-orange-600 italic block mt-1">* Dica de Ouro: Se o painel já possuir apontamentos do tipo "A" ou "CNAME" conflitantes, exclua os antigos primeiro.</span>
                  </p>

                  <div className="border border-stone-300 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Cabeçalho da Tabela */}
                    <div className="bg-stone-100 text-xs font-black text-stone-500 p-4 grid grid-cols-12 gap-3 uppercase tracking-widest border-b border-stone-200">
                      <div className="col-span-4">Nome (Host)</div>
                      <div className="col-span-2">Tipo</div>
                      <div className="col-span-6">Dados (Valor/Destino)</div>
                    </div>

                    {/* Linha 1: TIPO A */}
                    <div className="p-4 grid grid-cols-12 gap-3 border-b border-stone-100 text-sm items-center hover:bg-stone-50 transition-colors">
                      <div className="col-span-4 text-stone-500 font-medium">@ <span className="text-[11px] text-stone-400 italic">(Ou deixe em branco)</span></div>
                      <div className="col-span-2 font-black text-stone-800">A</div>
                      <div className="col-span-6 flex justify-between items-center bg-teal-50 border border-teal-100 px-3 py-2 rounded-lg">
                        <span className="font-mono text-teal-700 font-bold select-all">199.36.158.100</span>
                        <button onClick={() => { navigator.clipboard.writeText('199.36.158.100'); showToast('IP copiado!', 'success'); }} className="text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm border border-teal-100"><Copy size={14} /> Copiar</button>
                      </div>
                    </div>

                    {/* Linha 2: CNAME (WWW) */}
                    <div className="p-4 grid grid-cols-12 gap-3 border-b border-stone-100 text-sm items-center hover:bg-stone-50 transition-colors">
                      <div className="col-span-4 font-mono text-stone-800 font-bold">www</div>
                      <div className="col-span-2 font-black text-stone-800">CNAME</div>
                      <div className="col-span-6 flex justify-between items-center bg-teal-50 border border-teal-100 px-3 py-2 rounded-lg">
                        <span className="font-mono text-teal-700 font-bold select-all truncate">sitezing.com.br</span>
                        <button onClick={() => { navigator.clipboard.writeText(`sitezing.com.br`); showToast('Destino copiado!', 'success'); }} className="text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm border border-teal-100 shrink-0 ml-2"><Copy size={14} /> Copiar</button>
                      </div>
                    </div>

                    {/* Linha 3: TXT (Se houver) */}
                    {domainRecords && domainRecords.length > 0 && (
                      <div className="p-4 grid grid-cols-12 gap-3 text-sm items-center hover:bg-stone-50 transition-colors">
                        <div className="col-span-4 text-stone-500 font-medium">@ <span className="text-[11px] text-stone-400 italic">(Ou deixe em branco)</span></div>
                        <div className="col-span-2 font-black text-stone-800">TXT</div>
                        <div className="col-span-6 flex justify-between items-center bg-teal-50 border border-teal-100 px-3 py-2 rounded-lg">
                          <span className="font-mono text-xs text-teal-700 font-bold select-all truncate" title={domainRecords[0]?.records[0]?.text || `firebase-site-verification=${currentProjectSlug}-app`}>
                            {domainRecords[0]?.records[0]?.text || `firebase-site-verification=${currentProjectSlug}-app`}
                          </span>
                          <button onClick={() => { navigator.clipboard.writeText(domainRecords[0]?.records[0]?.text || `firebase-site-verification=${currentProjectSlug}-app`); showToast('TXT copiado!', 'success'); }} className="text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm border border-teal-100 shrink-0 ml-2"><Copy size={14} /> Copiar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={() => setIsDnsModalOpen(false)} className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors">
                  Pronto, entendi como configurar
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-stone-900/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
              <div className="w-24 h-24 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl mb-8 relative">
                <Rocket className="w-12 h-12 text-orange-500 animate-bounce relative z-10" />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-orange-500/40 to-transparent blur-xl rounded-full animate-pulse"></div>
              </div>
              <img src={BRAND_LOGO} alt="SiteZing" className="h-8 mb-4 opacity-50 block" />
              <h2 className="text-3xl font-black text-white px-6 text-center tracking-tight">Criando sua Mágica...</h2>
              <p className="text-stone-400 mt-3 text-sm font-medium animate-pulse text-center max-w-sm px-6">A Inteligência Artificial está escrevendo e montando o layout do seu novo site profissional em segundos.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPublishing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-stone-900/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
              <div className="w-24 h-24 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl mb-8 relative">
                <Globe className="w-12 h-12 text-emerald-400 animate-pulse relative z-10" />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-emerald-500/40 to-transparent blur-xl rounded-full animate-bounce"></div>
              </div>
              <img src={BRAND_LOGO} alt="SiteZing" className="h-8 mb-4 opacity-50 block" />
              <h2 className="text-3xl font-black text-white px-6 text-center tracking-tight">Publicando Site...</h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={publishMsgIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-emerald-400 mt-3 text-sm font-medium text-center max-w-sm px-6 h-10"
                >
                  {publishMsgs[publishMsgIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full h-[100dvh] bg-[#FAFAF9] overflow-hidden font-sans text-stone-900 flex flex-col md:flex-row">

        <div className="flex-1 relative h-full overflow-hidden bg-[#FAFAF9]">
          <iframe
            ref={iframeRef}
            srcDoc={generatedHtml ? getPreviewHtml(generatedHtml) : getDynamicPromoHtml(platformConfigs)}
            className="w-full h-full border-none bg-transparent min-h-screen"
            title="Visão Principal"
          />

          <AnimatePresence>
            {!isMenuOpen && !isMobile && (
              <div
                className={`absolute top-6 right-6 z-[90] flex items-center cursor-pointer group`}
                onClick={() => setIsMenuOpen(true)}
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative flex items-center justify-center">
                  <div className="relative flex items-center justify-center bg-white w-12 h-12 rounded-full border border-stone-200 shadow-lg group-hover:shadow-xl transition-all group-hover:border-stone-300 text-stone-600 group-hover:text-stone-900">
                    <Menu size={20} />
                    <GuidedTip step={2} currentStep={guideStep} text="Clique aqui para continuar editando seu site!" position="top" />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {renderMobileBottomSheet()}
          {renderMobileBottomNav()}
        </div>

        <Suspense fallback={null}>
          <LoginPage isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSubmit={handleLoginSubmit} />
        </Suspense>

        <AnimatePresence initial={false}>
          {isMenuOpen && !isMobile && (
            <motion.div
              initial={{ width: 0, paddingLeft: 0, paddingRight: 0 }}
              animate={{ width: 420, paddingLeft: 16, paddingRight: 16 }}
              exit={{ width: 0, paddingLeft: 0, paddingRight: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="flex-shrink-0 h-full flex flex-col justify-center overflow-hidden relative z-50 bg-[#FAFAF9] w-full md:w-[420px] py-4"
            >
              <motion.div
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ delay: 0.1 }}
                className="w-full h-full lg:aspect-[16/9] lg:max-h-[min(90vh,900px)] lg:mx-auto lg:my-auto bg-[#F8FAFC] border border-stone-200 lg:rounded-[2rem] rounded-none shadow-xl flex flex-col overflow-hidden relative"
              >
                <div className="flex justify-between items-center px-6 py-5 border-b border-stone-200 flex-shrink-0 bg-white">
                  <div className="flex items-center gap-3 select-none">
                    <img src={BRAND_LOGO} alt="SiteZing" className="h-10 w-auto object-contain" />
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsSupportModalOpen(true)} className="text-stone-400 hover:text-indigo-500 transition-colors p-2 rounded-full hover:bg-indigo-50" title="Central de Ajuda (Falar com Suporte)">
                      <HelpCircle size={18} />
                    </button>
                    <button onClick={sharePlatform} className="text-stone-400 hover:text-orange-500 transition-colors p-2 rounded-full hover:bg-orange-50" title="Compartilhar SiteZing">
                      <ExternalLink size={18} />
                    </button>
                    <div className="w-px h-4 bg-stone-200"></div>
                    {loggedUserEmail ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(true); }}
                          className="text-stone-400 hover:text-indigo-500 transition-colors p-2 rounded-full hover:bg-indigo-50"
                          title="Ir para Meus Sites"
                        >
                          <LayoutDashboard size={18} />
                        </button>
                        <button
                          onClick={handleLogout}
                          className="text-stone-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                          title="Sair da Conta"
                        >
                          <LogOut size={18} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setIsLoginOpen(true)} className="text-xs font-bold text-teal-600 hover:text-teal-500 transition-colors flex items-center gap-1.5"><LogIn size={16} /> Login</button>
                    )}
                    <div className="w-px h-4 bg-stone-200"></div>
                    <button onClick={() => { setIsMenuOpen(false); nextGuideStep(2); }} className={`text-stone-400 hover:text-stone-800 transition-colors relative ${guideStep === 1 ? 'animate-guide-pulse bg-orange-100 rounded-full p-1' : ''}`} title="Esconder Painel">
                      <X size={18} />
                      <GuidedTip step={1} currentStep={guideStep} text="Minimize aqui para ver como seu site ficou!" position="bottom" />
                    </button>
                  </div>
                </div>

                {(() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  let daysLeft = 0; let isPaid = false;
                  if (currentProject?.expiresAt) {
                    const expirationDate = getExpirationTimestampMs(currentProject.expiresAt);
                    if (expirationDate) {
                      daysLeft = Math.ceil((expirationDate - Date.now()) / (1000 * 3600 * 24));
                    }
                    isPaid = currentProject.paymentStatus === 'paid';
                  }
                  return (
                    <div className="flex border-b border-stone-200/70 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-white/70 backdrop-blur-md">
                      <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'dashboard' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/40' : 'text-stone-500 hover:text-stone-800 hover:bg-white/60'}`}>
                        <LayoutDashboard size={12} /> Meus Sites
                      </button>
                      {generatedHtml && (
                        <>
                          <button onClick={() => setActiveTab('geral')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'geral' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/40' : 'text-stone-500 hover:text-stone-800 hover:bg-white/60'}`}>
                            <Edit3 size={12} /> Visual
                          </button>
                          <button onClick={() => setActiveTab('dominio')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors relative flex items-center justify-center gap-1.5 ${activeTab === 'dominio' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40' : 'text-stone-500 hover:text-stone-800 hover:bg-white/60'}`}>
                            <Globe size={12} /> Domínio
                          </button>
                          {currentProjectSlug && (
                            <button onClick={() => setActiveTab('assinatura')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors relative flex items-center justify-center gap-1.5 ${activeTab === 'assinatura' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/40' : 'text-stone-500 hover:text-stone-800 hover:bg-white/60'}`}>
                              <CreditCard size={12} /> Plano
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}

                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 pb-6 bg-white">
                  {activeTab === 'geral' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* CATEGORIAS SUPERIORES - ÍCONES MENORES */}
                      <div 
                        ref={categoryNavRef}
                        onMouseDown={handleNavMouseDown}
                        onMouseLeave={handleNavMouseLeave}
                        onMouseUp={handleNavMouseUp}
                        onMouseMove={handleNavMouseMove}
                        className={`flex gap-2 mb-6 overflow-x-auto pb-2 px-1 cursor-grab active:cursor-grabbing select-none ${isMobile ? 'scrollbar-hide' : ''}`}
                      >
                        <button
                          onClick={() => setActiveCategory(activeCategory === 'visual' ? null : 'visual')}
                          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === 'visual' ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-500/30' : 'bg-white text-stone-600 border-stone-200 hover:border-indigo-300'}`}
                        >
                          <Palette size={14} /> Visual
                        </button>
                        <button
                          onClick={() => setActiveCategory(activeCategory === 'social' ? null : 'social')}
                          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === 'social' ? 'bg-pink-600 text-white border-pink-700 shadow-lg shadow-pink-500/30' : 'bg-white text-stone-600 border-stone-200 hover:border-pink-300'}`}
                        >
                          <Instagram size={14} /> Redes
                        </button>
                        <button
                          onClick={() => setActiveCategory(activeCategory === 'delivery' ? null : 'delivery')}
                          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === 'delivery' ? 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-500/30' : 'bg-white text-stone-600 border-stone-200 hover:border-red-300'}`}
                        >
                          <Rocket size={14} /> Delivery
                        </button>
                        <button
                          onClick={() => setActiveCategory(activeCategory === 'contato' ? null : 'contato')}
                          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === 'contato' ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-500/30' : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300'}`}
                        >
                          <Phone size={14} /> Contato
                        </button>
                      </div>

                      {/* CONTEÚDO DINÂMICO POR CATEGORIA */}
                      <div className="space-y-6">
                        {(!activeCategory || activeCategory === 'visual') && (
                          <div className="space-y-4 animate-in fade-in duration-500">
                            {/* SINCRONIZAR GOOGLE (DESKTOP) */}
                            <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl shadow-sm mb-6">
                              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block flex items-center justify-center gap-2">Sincronizar com Google</label>
                              <div className="flex gap-2">
                                <input 
                                  className="flex-1 bg-white border border-blue-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 shadow-sm" 
                                  placeholder="Cole o link do seu negócio no Google Maps" 
                                  value={formData.googlePlaceUrl} 
                                  onChange={e => { setFormData({ ...formData, googlePlaceUrl: e.target.value }); setHasUnsavedChanges(true) }} 
                                />
                                <button 
                                  onClick={() => fetchGoogleData(false)}
                                  disabled={isFetchingGoogle || !formData.googlePlaceUrl}
                                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-stone-300 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 min-w-[120px]"
                                >
                                  {isFetchingGoogle ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>GOOGLE <Zap size={13} fill="currentColor" /></>}
                                </button>
                              </div>

                              {googleStatus && (
                                <div className={`text-[10px] font-bold p-3 rounded-xl mt-3 flex items-center gap-2 ${googleStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                  {googleStatus.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                  {googleStatus.msg}
                                </div>
                              )}

                              {pendingGoogleData && (
                                <div className="bg-white border-2 border-blue-400 rounded-2xl p-4 shadow-2xl animate-up mt-4 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-2 opacity-10"><Zap size={40} className="text-blue-600" /></div>
                                  <div className="flex items-center gap-3 mb-4 relative z-10 text-left">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner"><CheckCircle size={24} /></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Empresa Localizada!</p>
                                      <p className="text-xs font-black text-stone-900 truncate leading-tight uppercase italic">{pendingGoogleData.name}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 relative z-10">
                                    <button onClick={() => setPendingGoogleData(null)} className="flex-1 py-3 bg-stone-100 text-stone-500 rounded-xl text-[10px] uppercase font-black hover:bg-stone-200 transition-colors">Ignorar</button>
                                    <button onClick={confirmGoogleInjection} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-[10px] uppercase font-black shadow-lg shadow-blue-600/30 active:scale-95 transition-all">Importar Agora ✨</button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Palette size={12} /> Design & Identidade</label>

                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-500 uppercase px-1">Nome do Negócio</label>
                                <input className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[13px] font-bold text-stone-800 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: Studio da Beleza" value={formData.businessName} onChange={e => handleFloatNameChange(e.target.value)} />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-500 uppercase px-1">Frase de Destaque</label>
                                <textarea className="w-full h-20 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[13px] resize-none focus:border-indigo-500 outline-none transition-all text-stone-800" placeholder="Descreva seu diferencial..." value={formData.description} onChange={e => handleDescriptionSync(e.target.value)} />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-blue-500 uppercase px-1 flex items-center gap-1.5"><Globe size={11} /> Descrição para o Google (SEO)</label>
                                <textarea 
                                  className="w-full h-16 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 text-xs resize-none focus:border-blue-400 outline-none transition-all text-stone-800 font-medium" 
                                  placeholder="Resumo curto para o buscador..." 
                                  value={formData.seoDescription} 
                                  onChange={e => { setFormData({ ...formData, seoDescription: e.target.value, isSeoDescriptionEdited: true }); setHasUnsavedChanges(true) }} 
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[10px] font-bold text-stone-500 uppercase px-1">Estilo</label>
                                  <select className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-indigo-500" value={formData.layoutStyle} onChange={e => { setFormData({ ...formData, layoutStyle: e.target.value }); setHasUnsavedChanges(true) }}>{LAYOUT_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
                                </div>
                                <div className="space-y-1.5 text-left">
                                  <label className="text-[10px] font-bold text-stone-500 uppercase px-1">Topo</label>
                                  <select className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-indigo-500" value={formData.headerLayout} onChange={e => { setFormData({ ...formData, headerLayout: e.target.value }); setHasUnsavedChanges(true) }}>
                                    <option value="logo_left_icons_right">Logo Esquerda</option>
                                    <option value="logo_right_icons_left">Logo Direita</option>
                                    <option value="logo_center_icons_right">Logo Centro</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                                <label className="text-[10px] font-bold text-stone-500 uppercase flex justify-between items-center"><span>Sua Logomarca</span>{formData.logoBase64 && <button onClick={() => { setFormData(p => ({ ...p, logoBase64: '', logoSize: 40 })); setHasUnsavedChanges(true); }} className="text-red-500 hover:text-red-600 text-[9px] font-black uppercase">X Remover</button>}</label>
                                {!formData.logoBase64 ? (
                                  <label className="cursor-pointer w-full border border-dashed border-stone-300 hover:border-indigo-400 rounded-xl py-6 flex flex-col justify-center items-center gap-2 text-[10px] text-stone-500 transition-all bg-white"><Upload size={18} /><span>Subir Marca</span><input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></label>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-lg border border-stone-200 flex items-center justify-center p-1"><img src={formData.logoBase64} className="max-w-full max-h-full object-contain" alt="Logo" /></div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex justify-between text-[9px] font-bold text-stone-400 uppercase"><span>Tamanho</span><span>{formData.logoSize}px</span></div>
                                      <input type="range" min="20" max="100" value={formData.logoSize} onChange={e => { setFormData({ ...formData, logoSize: parseInt(e.target.value) }); setHasUnsavedChanges(true) }} className="w-full accent-indigo-500" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                                <label className="text-[10px] font-bold text-stone-500 uppercase flex justify-between items-center"><span>Favicon (Ícone do Navegador)</span>{formData.faviconBase64 && <button onClick={() => { setFormData(p => ({ ...p, faviconBase64: '' })); setHasUnsavedChanges(true); }} className="text-red-500 hover:text-red-600 text-[9px] font-black uppercase">X Remover</button>}</label>
                                {!formData.faviconBase64 ? (
                                  <label className="cursor-pointer w-full border border-dashed border-stone-300 hover:border-indigo-400 rounded-xl py-4 flex flex-col justify-center items-center gap-2 text-[10px] text-stone-500 transition-all bg-white"><Upload size={16} /><span>Subir Ícone</span><input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => { setFormData({ ...formData, faviconBase64: event.target?.result as string }); setHasUnsavedChanges(true); };
                                      reader.readAsDataURL(file);
                                    }
                                  }} className="hidden" /></label>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-lg border border-stone-200 flex items-center justify-center p-1"><img src={formData.faviconBase64} className="max-w-full max-h-full object-contain" alt="Favicon" /></div>
                                    <div className="flex-1">
                                      <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Definido com sucesso</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeCategory === 'social' && (
                          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Instagram size={12} className="text-pink-500" /> Redes Sociais</label>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4285F4]"><MapPin size={14} /></span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#4285F4] outline-none font-bold" placeholder="Google (Avaliações ou Maps)" value={formData.googlePlaceUrl} onChange={e => { setFormData({ ...formData, googlePlaceUrl: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#25D366]"><Phone size={14} /></span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#25D366] outline-none font-bold" placeholder="WhatsApp (DDD + Número)" value={formData.whatsapp} onChange={e => { setFormData({ ...formData, whatsapp: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E1306C]"><Instagram size={14} /></span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#E1306C] outline-none font-bold" placeholder="Instagram (@usuario ou Link)" value={formData.instagram} onChange={e => { setFormData({ ...formData, instagram: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1877F2]"><Edit3 size={14} /></span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#1877F2] outline-none font-bold" placeholder="Facebook (Link)" value={formData.facebook} onChange={e => { setFormData({ ...formData, facebook: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-black"><Edit3 size={14} /></span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-black outline-none font-bold" placeholder="X (Link)" value={formData.x} onChange={e => { setFormData({ ...formData, x: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-black"><Star size={14} /></span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-black outline-none font-bold" placeholder="TikTok (Link)" value={formData.tiktok} onChange={e => { setFormData({ ...formData, tiktok: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                            </div>
                          </div>
                        )}

                        {activeCategory === 'delivery' && (
                          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Rocket size={12} className="text-red-500" /> Canais de Venda</label>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EA1D2C] font-black text-[10px]">IF</span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#EA1D2C] outline-none font-bold" placeholder="iFood (Link da Loja)" value={formData.ifood} onChange={e => { setFormData({ ...formData, ifood: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF441F] font-black text-[10px]">RP</span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#FF441F] outline-none font-bold" placeholder="Rappi (Link da Loja)" value={formData.rappi} onChange={e => { setFormData({ ...formData, rappi: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FCCC24] font-black text-[10px]">ZE</span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#FCCC24] outline-none font-bold" placeholder="Zé Delivery (Link)" value={formData.zeDelivery} onChange={e => { setFormData({ ...formData, zeDelivery: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#19B84A] font-black text-[10px]">KT</span><input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#19B84A] outline-none font-bold" placeholder="Keeta (Link da Loja)" value={formData.keeta} onChange={e => { setFormData({ ...formData, keeta: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Link Personalizado</label>
                                <input className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-xs focus:border-blue-500 outline-none font-bold" placeholder="Nome do Botão (Ex: Ver Agenda)" value={formData.directLinkLabel} onChange={e => { setFormData({ ...formData, directLinkLabel: e.target.value }); setHasUnsavedChanges(true) }} />
                                <input className="w-full bg-white border border-stone-200 rounded-xl py-2 px-3 text-xs focus:border-blue-500 outline-none" placeholder="Link (URL)" value={formData.directLink} onChange={e => { setFormData({ ...formData, directLink: e.target.value }); setHasUnsavedChanges(true) }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeCategory === 'contato' && (
                          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <label className="text-[11px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 mb-2"><MapPin size={12} className="text-emerald-500" /> Localização</label>
                            <div className="grid grid-cols-1 gap-3">
                              <input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-xs focus:border-emerald-500 outline-none font-bold" placeholder="E-mail de Contato" value={formData.email} onChange={e => { setFormData({ ...formData, email: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-xs focus:border-emerald-500 outline-none font-bold" placeholder="Endereço Completo" value={formData.address} onChange={e => { setFormData({ ...formData, address: e.target.value }); setHasUnsavedChanges(true) }} />
                              <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                                <label className="flex items-center justify-between text-[10px] font-bold text-stone-600 uppercase"><span>Exibir Mapa</span><input type="checkbox" checked={formData.showMap} onChange={e => { setFormData({ ...formData, showMap: e.target.checked }); setHasUnsavedChanges(true) }} className="accent-emerald-500" /></label>
                                <label className="flex items-center justify-between text-[10px] font-bold text-stone-600 uppercase"><span>Formulário</span><input type="checkbox" checked={formData.showForm} onChange={e => { setFormData({ ...formData, showForm: e.target.checked }); setHasUnsavedChanges(true) }} className="accent-emerald-500" /></label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-8 mt-6 border-t border-stone-100">
                        <button
                          onClick={() => handleGenerate()}
                          disabled={isGenerating}
                          className="w-full bg-stone-900 hover:bg-black text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-stone-900/10"
                        >
                          {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={16} className="text-orange-400" />} {generatedHtml ? "Atualizar Site c/ IA" : "Gerar Meu Site"}
                        </button>
                      </div>
                    </div>
                  )}


                  {activeTab === 'dashboard' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 blur-[50px] rounded-full pointer-events-none"></div>
                        <h3 className="text-lg font-black text-stone-950 mb-1 flex items-center gap-2 relative z-10"><LayoutDashboard size={18} className="text-indigo-500" /> Meus Sites</h3>
                        <p className="text-xs text-stone-500 font-medium mb-6 relative z-10">Gerencie todos os seus projetos salvos na plataforma.</p>

                        {!loggedUserEmail ? (
                          <div className="text-center py-10 bg-stone-50 rounded-xl border border-stone-100">
                            <p className="text-sm text-stone-600 font-bold mb-4">Você precisa estar logado para ver seus sites.</p>
                            <button onClick={() => setIsLoginOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs px-6 py-3 rounded-xl transition-all shadow-md">Fazer Login</button>
                          </div>
                        ) : (
                          <div className="space-y-3 relative z-10">
                            {savedProjects.length === 0 ? <p className="text-xs text-stone-400 italic text-center py-8">Nenhum projeto ainda. Comece a criar o seu primeiro site!</p> : (
                              savedProjects.map((p) => (
                                <div
                                  key={p.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => handleLoadProject(p)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLoadProject(p); }}
                                  className={`flex flex-col sm:flex-row gap-3 bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${currentProjectSlug === p.id ? 'ring-2 ring-indigo-400' : ''}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <span className="font-black text-sm text-stone-800 truncate">{p.businessName || 'Projeto sem nome'}</span>
                                      {getStatusBadge(p)}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-stone-500 font-mono truncate">
                                      <Globe size={12} className="shrink-0" /> <span className="truncate">{p.publishUrl?.replace('https://', '') || 'Sem link público'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
                                      <Clock size={10} className="shrink-0" /> Atualizado em {new Date(p.updatedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex sm:flex-col justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-stone-100 pt-3 sm:pt-0 sm:pl-3 mt-1 sm:mt-0">
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSite(p.id); }} className="flex-1 sm:flex-none py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                      <Trash2 size={12} /> Excluir
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                        {loggedUserEmail && (
                          <div className="mt-6 text-center border-t border-stone-100 pt-6">
                            <button onClick={() => { setFormData({ businessName: '', description: '', region: '', whatsapp: '', instagram: '', facebook: '', linkedin: '', tiktok: '', youtube: '', x: '', rappi: '', zeDelivery: '', directLink: '', ifood: '', noveNove: '', keeta: '', phone: '', email: '', address: '', showMap: true, showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa', logoBase64: '', logoSize: 40, segment: '', googlePlaceUrl: '', showReviews: false, reviews: [], editorialSummary: '', customSlug: '', isCustomSlugEdited: false, googlePhotos: [], headerLayout: 'logo_left_icons_right', manualCss: '' }); setCurrentProjectSlug(null); setGeneratedHtml(null); setOfficialDomain(''); setPublishModalUrl(null); setActiveTab('geral'); setConfirmDialog({ title: 'Novo Site', message: 'Deseja iniciar um projeto em branco?', onConfirm: () => { window.location.reload(); } }) }} className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest">+ Criar Novo Site</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'dominio' && generatedHtml && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      {!currentProjectSlug ? (
                        <div className="bg-teal-50/50 p-5 rounded-2xl border border-teal-100">
                          <h4 className="text-sm font-bold text-teal-700 flex items-center gap-2"><Globe size={16} /> Qual será o endereço?</h4>
                          <p className="text-xs text-teal-600/80 mb-5 leading-relaxed">Antes de salvar, precisamos saber se você vai usar um domínio oficial (Ex: Registro.br).</p>
                          <Suspense fallback={null}><DomainChecker onDomainChange={(domain, isLater) => { setOfficialDomain(domain); setRegisterLater(isLater); }} /></Suspense>
                        </div>
                      ) : (() => {
                        const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                        const hasCustomDomain = currentProject?.officialDomain && currentProject.officialDomain !== 'Pendente' && !currentProject.officialDomain.includes('.sitezing.com.br');
                        const isDomainActive = currentProject?.domainStatus === 'ACTIVE' || currentProject?.domainStatus === 'HOSTING_ACTIVE';

                        return (
                          <div className="space-y-4">
                            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                              <div className="flex items-center gap-3 mb-5">
                                <div className="bg-teal-100 p-2.5 rounded-xl"><Globe className="text-teal-600 w-5 h-5" /></div>
                                <div>
                                  <h3 className="font-bold text-stone-950 text-sm">Domínio Profissional</h3>
                                  <p className="text-[10px] text-stone-500">Conecte seu próprio endereço</p>
                                </div>
                              </div>

                              {!hasCustomDomain ? (
                                <div className="space-y-6">
                                  {/* PASSO 1: Obter Domínio */}
                                  <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-bl-lg">Passo 1</div>
                                    <h4 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2"><Star size={16} className="text-orange-500" /> Obtenha seu endereço oficial</h4>
                                    <p className="text-xs text-stone-600 leading-relaxed mb-4">
                                      Para passar credibilidade, seu site precisa de um endereço profissional (ex: <b>suaempresa.com.br</b>). Recomendamos registrar o seu domínio diretamente no órgão oficial do Brasil, o Registro.br (custa apenas R$ 40,00 por ano).
                                    </p>
                                    <a
                                      href="https://registro.br"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                                    >
                                      <ExternalLink size={14} /> Abrir Registro.br
                                    </a>
                                  </div>

                                  {/* PASSO 2: Conectar Domínio */}
                                  <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm relative">
                                    <div className="absolute top-0 right-0 bg-teal-100 text-teal-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-bl-lg">Passo 2</div>
                                    <h4 className="text-sm font-bold text-stone-900 mb-2">Já tenho um domínio. Conectar agora:</h4>
                                    <p className="text-[10px] text-stone-500 mb-4">Digite apenas o endereço raiz. O nosso sistema já configura o "www" automaticamente para você.</p>

                                    <div className="flex flex-col sm:flex-row gap-2 relative">
                                      <div className="relative flex-1">
                                        <input
                                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-12 text-sm focus:border-teal-500 outline-none transition-colors font-mono text-stone-700 h-12"
                                          placeholder="suamarca.com.br"
                                          value={customDomainInput}
                                          onChange={e => {
                                            let val = e.target.value.toLowerCase().trim();
                                            val = val.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
                                            setCustomDomainInput(val);
                                          }}
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-sm pointer-events-none">www.</span>
                                      </div>
                                      <button
                                        onClick={handleAddCustomDomain}
                                        disabled={isLinkingDomain || !customDomainInput}
                                        className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white px-6 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 h-12 shrink-0"
                                      >
                                        {isLinkingDomain ? <Loader2 size={16} className="animate-spin" /> : 'Conectar'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-5">
                                  <div className="flex items-center justify-between bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Endereço Vinculado</span>
                                      <span className="font-mono text-sm font-bold text-teal-700">{currentProject.officialDomain}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col gap-1 items-end">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isDomainActive ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700 animate-pulse'}`}>
                                          {isDomainActive ? 'Propagado' : 'Pendente'}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isDomainActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                          {isDomainActive ? 'SSL Ativo ✅' : 'SSL Gerando... ⏳'}
                                        </span>
                                      </div>
                                      {/* BOTÃO PARA DESCONECTAR O DOMÍNIO */}
                                      <button
                                        onClick={() => handleRemoveDomain(currentProject.officialDomain)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        title="Desconectar Domínio"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>

                                  {!isDomainActive && (
                                    <div className="bg-orange-50 border border-orange-200 p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                                      <Settings className="text-orange-400 w-8 h-8" />
                                      <div>
                                        <h4 className="text-sm font-black text-orange-800">Finalize a Configuração DNS</h4>
                                        <p className="text-[11px] text-orange-700/80 mt-1">Para o site funcionar, você precisa adicionar alguns dados no seu provedor de domínio.</p>
                                      </div>
                                      <button
                                        onClick={() => setIsDnsModalOpen(true)}
                                        className="mt-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-orange-500/20"
                                      >
                                        Abrir Instruções de Apontamento
                                      </button>
                                    </div>
                                  )}

                                  <button
                                    onClick={() => handleVerifyDomain(currentProject.officialDomain)}
                                    disabled={isVerifyingDomain || isDomainActive}
                                    className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isDomainActive ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20'}`}
                                  >
                                    {isVerifyingDomain ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                    {isDomainActive ? 'Conectado e Operacional' : 'Verificar Propagação'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {activeTab === 'plataforma' && loggedUserEmail === 'caiotleal@gmail.com' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                      <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 blur-[50px] rounded-full pointer-events-none opacity-50"></div>
                        <h3 className="text-sm font-black text-purple-700 mb-1 flex items-center gap-2"><Settings size={16} /> Configurações Globais</h3>
                        <p className="text-[10px] text-purple-600/70 uppercase font-bold tracking-widest mb-6">Controle preços, banners e branding</p>

                        <div className="space-y-5 relative z-10">
                          {/* PREÇOS */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={12} /> Tabela de Preços (Stripe)</label>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold text-stone-500 uppercase">Mensal (R$)</span>
                                <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm font-black text-stone-800 focus:border-purple-400 outline-none" value={platformConfigs?.pricing?.mensal || ''} onChange={e => setPlatformConfigs({ ...platformConfigs, pricing: { ...platformConfigs.pricing, mensal: e.target.value } })} />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold text-stone-500 uppercase">Anual (R$)</span>
                                <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm font-black text-stone-800 focus:border-purple-400 outline-none" value={platformConfigs?.pricing?.anual || ''} onChange={e => setPlatformConfigs({ ...platformConfigs, pricing: { ...platformConfigs.pricing, anual: e.target.value } })} />
                              </div>
                            </div>
                          </div>

                          {/* BANNERS */}
                          <div className="space-y-3 pt-4 border-t border-purple-100">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2"><Zap size={12} /> Banner de Marketing (Topo)</label>
                            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
                              <label className="flex items-center justify-between text-xs font-bold text-stone-600">
                                <span>Banner Ativo?</span>
                                <input type="checkbox" checked={platformConfigs?.marketing?.bannerActive || false} onChange={e => setPlatformConfigs({ ...platformConfigs, marketing: { ...platformConfigs.marketing, bannerActive: e.target.checked } })} className="accent-purple-500 w-4 h-4" />
                              </label>
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold text-stone-500 uppercase">Texto do Banner</span>
                                <input className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-700 focus:border-purple-400 outline-none" placeholder="Ex: Black Friday: 50% OFF!" value={platformConfigs?.marketing?.bannerText || ''} onChange={e => setPlatformConfigs({ ...platformConfigs, marketing: { ...platformConfigs.marketing, bannerText: e.target.value } })} />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold text-stone-500 uppercase">Tipo / Cor</span>
                                <select className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-700 outline-none" value={platformConfigs?.marketing?.bannerType || 'info'} onChange={e => setPlatformConfigs({ ...platformConfigs, marketing: { ...platformConfigs.marketing, bannerType: e.target.value } })}>
                                  <option value="info">Azul (Informação)</option>
                                  <option value="warning">Laranja (Destaque)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* CHAVES DE CONEXÃO */}
                          <div className="space-y-3 pt-4 border-t border-purple-100">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12} /> Chave Stripe Production</label>
                            <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-[10px] font-mono text-stone-500 focus:border-purple-400 outline-none" placeholder="sk_live_..." type="password" value={platformConfigs?.stripe?.secretKey || ''} onChange={e => setPlatformConfigs({ ...platformConfigs, stripe: { ...platformConfigs.stripe, secretKey: e.target.value } })} />
                            <p className="text-[9px] text-stone-400 italic">Cuidado: Alterar esta chave pode quebrar os pagamentos atuais.</p>
                          </div>

                          {/* TERMOS E LEGAL */}
                          <div className="space-y-3 pt-4 border-t border-purple-100">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12} /> Conteúdo Institucional</label>
                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-stone-500 uppercase">Termos de Uso (Texto)</span>
                              <textarea className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-700 h-24 resize-none outline-none focus:border-purple-400" placeholder="Digite os termos de uso aqui..." value={platformConfigs?.legal?.terms || ''} onChange={e => setPlatformConfigs({ ...platformConfigs, legal: { ...platformConfigs.legal, terms: e.target.value } })} />
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                setIsSavingProject(true);
                                const upFn = httpsCallable(functions, 'updatePlatformConfigs');
                                await upFn(platformConfigs);
                                showToast("Configurações da Plataforma Atualizadas!", "success");
                              } catch (e: any) {
                                console.error(e);
                                showToast("Erro ao salvar: " + e.message, "error");
                              } finally {
                                setIsSavingProject(false);
                              }
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                          >
                            {isSavingProject ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />} Salvar Alterações Globais
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'assinatura' && currentProjectSlug && (() => {
                    const currentProject = savedProjects.find(p => p.id === currentProjectSlug);

                    const expirationDate = currentProject?.expiresAt ? getExpirationTimestampMs(currentProject.expiresAt) : null;
                    const daysLeft = expirationDate ? Math.ceil((expirationDate - Date.now()) / (1000 * 3600 * 24)) : 0;

                    const isPaid = currentProject?.paymentStatus === 'paid';
                    const isCanceled = currentProject?.cancelAtPeriodEnd === true || currentProject?.subscriptionStatus === 'canceled';

                    let isExpired = false;
                    if (expirationDate && expirationDate < Date.now() && !isPaid) {
                      isExpired = true;
                    }
                    const needsPayment = currentProject?.status === 'frozen' || isExpired;

                    return (
                      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 blur-[50px] rounded-full pointer-events-none"></div>
                          <h3 className="text-lg font-black text-stone-950 mb-1 flex items-center gap-2"><CreditCard size={18} className="text-orange-500" /> Assinatura</h3>
                          <p className="text-xs text-stone-500 mb-6">Gerencie o plano do projeto <span className="text-orange-500 font-mono">{currentProjectSlug}</span></p>

                          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 mb-6 relative z-10 shadow-inner">
                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Resumo da Conta</h4>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                                <span className="text-xs text-stone-500 font-medium">Status do Site</span>
                                <span className={`text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md ${daysLeft > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {daysLeft > 0 ? 'Online (Ativo)' : 'Offline (Congelado)'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                                <span className="text-xs text-stone-500 font-medium">Situação do Plano</span>
                                <span className="text-xs font-bold text-stone-800">
                                  {isPaid ? (isCanceled ? 'Cancelada' : `Assinatura Ativa (${currentProject?.planSelected || 'Plano'})`) : 'Teste Gratuito (Trial)'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-stone-500 font-medium">Tempo / Vencimento</span>
                                <span className="text-xs font-bold text-stone-800 text-right">
                                  {!isPaid && daysLeft > 0 && `Faltam ${daysLeft} dias para acabar`}
                                  {!isPaid && daysLeft <= 0 && `Teste encerrado`}
                                  {isPaid && !isCanceled && expirationDate && `Próxima renovação em ${new Date(expirationDate).toLocaleDateString('pt-BR')}`}
                                  {isPaid && isCanceled && expirationDate && `No ar até ${new Date(expirationDate).toLocaleDateString('pt-BR')}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isPaid && isCanceled && daysLeft > 0 ? (
                            <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl text-center space-y-4 relative z-10">
                              <h4 className="font-black text-orange-700 text-lg uppercase tracking-wider">Assinatura Cancelada</h4>
                              <p className="text-xs text-orange-600/80 mb-2">Seu site continuará no ar, recebendo visitas e contatos normalmente até o cumprimento total do período que você já pagou. Nenhum valor retroativo será cobrado ou estornado.</p>
                              <p className="text-[11px] text-orange-700/60 font-medium">Após o vencimento, o site entrará em estado de Congelamento por 5 dias e, após isso, será definitivamente suspenso. Deseja reativar a renovação automática para não perdê-lo?</p>
                              <button
                                onClick={() => handleResumeSubscription(currentProjectSlug)}
                                disabled={isResuming}
                                className="bg-orange-500 text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors w-full"
                              >
                                {isResuming ? <Loader2 className="animate-spin inline mr-2" /> : <RefreshCw className="inline mr-2" size={16} />} Reativar Assinatura
                              </button>
                            </div>
                          ) : isPaid && !isCanceled ? (
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center space-y-4 relative z-10">
                              <h4 className="font-black text-emerald-700 text-lg uppercase tracking-wider">Plano Operacional</h4>
                              <p className="text-xs text-emerald-600/70">Seu ambiente está operando com potência máxima e sem restrições.</p>
                              <div className="pt-2">
                                <button
                                  onClick={() => { setIsPlansBannerOpen(true); }}
                                  className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-6 py-3 rounded-xl text-xs font-bold transition-colors shadow-sm w-full uppercase tracking-wider"
                                >
                                  Mudar de Plano
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 gap-4">
                                {platformConfigs?.plans?.length > 0 ? (
                                  [...platformConfigs.plans].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((p: any) => {
                                    const isAnual = p.interval === 'year';
                                    return (
                                      <div key={p.id} className={`bg-white p-5 rounded-xl border ${isAnual ? 'border-orange-200' : 'border-teal-200'} flex flex-col h-full relative overflow-hidden shadow-sm`}>
                                        <img src={BRAND_LOGO} className="absolute bottom-[-10%] right-[-10%] w-1/2 opacity-[0.03] pointer-events-none filter grayscale" alt="" />
                                        <div className={`absolute top-0 right-0 ${isAnual ? 'bg-orange-500' : 'bg-teal-600'} text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg rounded-tr-lg`}>
                                          {p.badge || (isAnual ? 'Mais Econômico' : 'Recomendado')}
                                        </div>
                                        <h4 className={`${isAnual ? 'text-orange-500' : 'text-teal-600'} font-bold mb-2 uppercase tracking-wide text-xs`}>{p.name}</h4>
                                        <div className="flex items-end gap-1 mb-1">
                                          <span className="text-3xl font-black text-stone-950">R$ {p.price}</span>
                                          <span className="text-xs text-stone-500 font-medium pb-1">/
                                            {p.interval === 'month' ? 'mês' :
                                              p.interval === 'bimestral' ? 'bimestre' :
                                                p.interval === 'trimestral' ? 'trimestre' :
                                                  p.interval === 'semestral' ? 'semestre' : 'ano'}
                                          </span>
                                        </div>
                                        {p.allowInstallments && (
                                          <div className="text-[10px] font-bold text-emerald-600 mb-4 flex items-center gap-1">
                                            <CreditCard size={12} /> Ou em até {p.maxInstallments || 12}x no cartão
                                          </div>
                                        )}
                                        {!p.allowInstallments && <div className="mb-4"></div>}
                                        <ul className="space-y-2 text-xs text-stone-600 mb-6 flex-1 relative z-10">
                                          {p.features?.map((f: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {f}</li>
                                          ))}
                                        </ul>
                                        <button
                                          onClick={() => {
                                            if (currentProject?.stripeSubscriptionId && currentProject?.cancelAtPeriodEnd && currentProject?.status !== 'frozen') {
                                              handleResumeSubscription(currentProjectSlug);
                                            } else {
                                              setCheckoutDetailsModal({ projectId: currentProjectSlug, planType: p.name, priceId: p.priceId });
                                            }
                                          }}
                                          disabled={checkoutLoading === `${currentProjectSlug}-${p.name}` || isResuming}
                                          className={`w-full ${isAnual ? 'bg-orange-500 hover:bg-orange-400 shadow-orange-500/20' : 'bg-teal-600 hover:bg-teal-500 shadow-teal-500/20'} text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors relative z-10 shadow-lg`}
                                        >
                                          {checkoutLoading === `${currentProjectSlug}-${p.name}` || isResuming ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : (needsPayment ? `Reativar com ${p.name}` : `Assinar ${p.name}`)}
                                        </button>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <>
                                    <div className="bg-white p-5 rounded-xl border border-teal-200 flex flex-col h-full relative overflow-hidden shadow-sm">
                                      <img src={BRAND_LOGO} className="absolute bottom-[-10%] right-[-10%] w-1/2 opacity-[0.03] pointer-events-none filter grayscale" alt="" />
                                      <div className="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg rounded-tr-lg">Mais Assinado</div>
                                      <h4 className="text-teal-600 font-bold mb-2 uppercase tracking-wide text-xs">Plano Mensal</h4>
                                      <div className="flex items-end gap-1 mb-4"><span className="text-3xl font-black text-stone-950">R$ {platformConfigs?.pricing?.mensal || '49,90'}</span><span className="text-xs text-stone-500 font-medium pb-1">/mês</span></div>
                                      <ul className="space-y-2 text-xs text-stone-600 mb-6 flex-1 relative z-10">
                                        <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Domínio próprio & Suporte</li>
                                      </ul>
                                      <button
                                        onClick={() => {
                                          if (currentProject?.stripeSubscriptionId && currentProject?.cancelAtPeriodEnd && currentProject?.status !== 'frozen') {
                                            handleResumeSubscription(currentProjectSlug);
                                          } else {
                                            setCheckoutDetailsModal({ projectId: currentProjectSlug, planType: 'mensal' });
                                          }
                                        }}
                                        disabled={checkoutLoading === `${currentProjectSlug}-mensal` || isResuming}
                                        className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors relative z-10 shadow-lg shadow-teal-500/20"
                                      >
                                        {checkoutLoading === `${currentProjectSlug}-mensal` || isResuming ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : needsPayment ? 'Reativar com Plano Mensal' : 'Assinar Mensal'}
                                      </button>
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-orange-200 flex flex-col h-full relative overflow-hidden shadow-md">
                                      <img src={BRAND_LOGO} className="absolute bottom-[-10%] right-[-10%] w-1/2 opacity-[0.03] pointer-events-none filter grayscale" alt="" />
                                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg rounded-tr-lg">Mais Econômico</div>
                                      <h4 className="text-orange-500 font-bold mb-2 uppercase tracking-wide text-xs">Plano Anual</h4>
                                      <div className="flex items-end gap-1 mb-4"><span className="text-3xl font-black text-stone-950">R$ {platformConfigs?.pricing?.anual || '499'}</span><span className="text-xs text-stone-500 font-medium pb-1">/ano</span></div>
                                      <ul className="space-y-2 text-xs text-stone-600 mb-6 flex-1 relative z-10">
                                        <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> 2 meses grátis equivalentes</li>
                                      </ul>
                                      <button
                                        onClick={() => {
                                          if (currentProject?.stripeSubscriptionId && currentProject?.cancelAtPeriodEnd && currentProject?.status !== 'frozen') {
                                            handleResumeSubscription(currentProjectSlug);
                                          } else {
                                            setCheckoutDetailsModal({ projectId: currentProjectSlug, planType: 'anual' });
                                          }
                                        }}
                                        disabled={checkoutLoading === `${currentProjectSlug}-anual` || isResuming}
                                        className="w-full bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors shadow-lg shadow-orange-500/20 relative z-10"
                                      >
                                        {checkoutLoading === `${currentProjectSlug}-anual` || isResuming ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : needsPayment ? 'Reativar com Plano Anual' : 'Assinar Anual'}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-8 pt-6 border-t border-stone-100 relative z-10">
                            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Ações da Conta</h4>
                            {isPaid && !isCanceled ? (
                              <button
                                onClick={() => { setCancelModalProject(currentProjectSlug); setCancelTermsAccepted(false) }}
                                className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                              >
                                Cancelar Assinatura
                              </button>
                            ) : (
                              <button
                                onClick={() => showToast("Sua assinatura já encontra-se inativa ou em período de teste gratuito.", "info")}
                                className="w-full bg-stone-100 border border-stone-200 text-stone-400 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-not-allowed"
                              >
                                Cancelar Assinatura
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}


                </div>

                {generatedHtml && (() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  const isPublished = Boolean(currentProject?.publishUrl || currentProject?.status === 'active' || currentProject?.status === 'published');

                  let isExpired = false;
                  if (currentProject?.expiresAt) {
                    const expDate = getExpirationTimestampMs(currentProject.expiresAt);
                    if (expDate && expDate < Date.now() && currentProject.paymentStatus !== 'paid') {
                      isExpired = true;
                    }
                  }

                  const needsPayment = currentProject?.status === 'frozen' || isExpired;

                  return (
                    <div className="p-4 border-t border-stone-200 bg-white flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                      <button
                        onClick={handleSaveOrUpdateSite}
                        disabled={isSavingProject || (!hasUnsavedChanges && currentProjectSlug !== null)}
                        className={`w-full sm:flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${hasUnsavedChanges || !currentProjectSlug ? (guideStep === 2 ? 'bg-orange-500 animate-guide-pulse text-white shadow-lg' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md') : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                      >
                        {isSavingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />}
                        {currentProjectSlug ? 'Salvar Alterações' : 'Salvar Projeto'}
                        <GuidedTip step={2} currentStep={guideStep} text="Salve seu projeto para garantir seu link oficial!" position="top" />
                      </button>

                      {needsPayment ? (
                        <button
                          onClick={() => {
                            setActiveTab('assinatura');
                            showToast('Seu site expirou. Ative um plano para reativá-lo e poder publicar as alterações!', 'warning');
                          }}
                          className="w-full sm:flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                        >
                          <Zap size={14} />
                          Reativar Assinatura
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (hasUnsavedChanges || !currentProjectSlug) {
                              setIsSaveReminderOpen(true);
                            } else {
                              handlePublishSite();
                            }
                          }}
                          disabled={isPublishing}
                          className={`w-full sm:flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative ${!hasUnsavedChanges && currentProjectSlug ? (guideStep === 3 ? 'bg-orange-500 animate-guide-pulse text-white shadow-lg' : (isPublished ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20')) : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
                        >
                          {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPublished ? <RefreshCw size={14} /> : <Globe size={14} />)}
                          {isPublished ? 'Atualizar Publicação' : 'Publicar Site'}
                          <GuidedTip step={3} currentStep={guideStep} text="Clique aqui para colocar seu site no ar!" position="top" />
                        </button>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* MODAL DOS PLANOS E REGRAS (Vindo do iFrame) */}
      <AnimatePresence>
        {selectedPlanModal && (
          <div className="fixed inset-0 z-[400] bg-stone-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white rounded-[2.5rem] overflow-hidden max-w-lg w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative border border-stone-100"
            >
              <button onClick={() => setSelectedPlanModal(null)} className="absolute top-6 right-6 bg-stone-100 hover:bg-stone-200 text-stone-500 p-2.5 rounded-full transition-all z-20 hover:rotate-90">
                <X size={20} />
              </button>

              {(() => {
                const plan = platformConfigs?.plans?.find((p: any) => p.id === selectedPlanModal || p.priceId === selectedPriceId);
                const isAnual = plan?.interval === 'year';
                const isFree = selectedPlanModal === 'free';

                return (
                  <>
                    <div className={`p-10 pb-12 text-center relative overflow-hidden ${isFree ? 'bg-stone-50' :
                      isAnual ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white' : 'bg-gradient-to-br from-teal-600 to-emerald-700 text-white'
                      }`}>
                      {!isFree && (
                        <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                          <img src={BRAND_LOGO} className="w-full h-full object-cover scale-150 rotate-12" alt="" />
                        </div>
                      )}

                      <div className="relative z-10 space-y-4">
                        <div className="inline-block px-4 py-1 rounded-full border border-current opacity-70 text-[10px] font-black uppercase tracking-[0.2em]">
                          {isFree ? 'Experimente Agora' : (isAnual ? 'Melhor Custo-Benefício' : 'Plano Flexível')}
                        </div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tight leading-none">
                          {plan?.name || (isFree ? 'Plano Turbo Teste' : selectedPlanModal)}
                        </h2>
                        {plan && (
                          <div className="flex flex-col items-center">
                            <div className="flex items-end gap-1">
                              <span className="text-4xl font-black">R$ {plan.price}</span>
                              <span className="text-xs font-bold opacity-80 mb-1">
                                /{plan.interval === 'month' ? 'mês' :
                                  plan.interval === 'year' ? 'ano' : plan.interval}
                              </span>
                            </div>
                            {plan.allowInstallments && (
                              <div className="text-[11px] font-black mt-2 opacity-90 bg-black/10 px-3 py-1 rounded-lg flex items-center gap-2">
                                <CreditCard size={12} /> Em até {plan.maxInstallments}x de R$ {(parseFloat(plan.price) / parseInt(plan.maxInstallments)).toFixed(2)}*
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-10 bg-white">
                      <div className="space-y-6 mb-10">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm"><CheckCircle2 className="w-5 h-5" /></div>
                          <div>
                            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wide">Recursos Ilimitados</h4>
                            <p className="text-xs text-stone-500 mt-1 leading-relaxed">Criação completa via IA, todos os blocos liberados e design profissional de alto nível.</p>
                          </div>
                        </div>
                        {!isFree && (
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm"><Globe className="w-5 h-5" /></div>
                            <div>
                              <h4 className="font-black text-stone-900 text-sm uppercase tracking-wide">Infraestrutura Premium</h4>
                              <p className="text-xs text-stone-500 mt-1 leading-relaxed">Hospedagem Google Cloud com SSL (Cadeado ✅) e suporte para seu próprio domínio.</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 shadow-sm"><Rocket className="w-5 h-5" /></div>
                          <div>
                            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wide">Velocidade e SEO</h4>
                            <p className="text-xs text-stone-500 mt-1 leading-relaxed">Performance estelar para ranquear no Google e carregar instantaneamente no celular.</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button
                          onClick={() => {
                            setSelectedPlanModal(null);
                            setIsMenuOpen(true);
                          }}
                          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] transition-all shadow-xl hover:translate-y-[-2px] text-xs ${isFree
                            ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-stone-900/20'
                            : isAnual ? 'bg-orange-500 text-white hover:bg-orange-400 shadow-orange-500/30' : 'bg-teal-600 text-white hover:bg-teal-500 shadow-teal-500/30'
                            }`}
                        >
                          {isFree ? '🚀 Começar Teste Grátis' : '🚀 Criar meu site agora'}
                        </button>
                        <p className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          {isFree ? 'Sem cartão de crédito' : 'Acesso imediato após confirmação'}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NOVO MODAL: PLANOS (BANNER) */}
      <AnimatePresence>
        {isPlansBannerOpen && (
          <div className="fixed inset-0 z-[500] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="w-full max-w-5xl bg-stone-50 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="bg-white p-6 border-b border-stone-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center"><Briefcase size={20} /></div>
                  <h3 className="text-xl font-black text-stone-900 uppercase italic tracking-tight">Nossos Planos</h3>
                </div>
                <button onClick={() => { setIsPlansBannerOpen(false); window.location.hash = ''; }} className="text-stone-400 hover:text-orange-500 transition-colors bg-stone-100 hover:bg-orange-50 p-2 rounded-full cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    const currentProjectData = savedProjects.find((px: any) => px.projectSlug === currentProjectSlug);
                    return platformConfigs?.plans?.length > 0 ? (
                      [...platformConfigs.plans]
                        .filter((p: any) => p.name !== currentProjectData?.planSelected)
                        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map((p: any) => {
                          const isAnual = p.interval === 'year';
                          return (
                            <div key={p.id} className={`bg-white p-6 rounded-2xl border ${isAnual ? 'border-orange-200 shadow-orange-500/10' : 'border-stone-200'} flex flex-col h-full relative overflow-hidden shadow-xl hover:-translate-y-1 transition-transform`}>
                              <div className={`absolute top-0 right-0 ${isAnual ? 'bg-orange-500' : 'bg-stone-800'} text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-bl-xl tracking-wider`}>
                                {p.badge || (isAnual ? 'Mais Econômico' : 'Recomendado')}
                              </div>
                              <h4 className={`${isAnual ? 'text-orange-500' : 'text-stone-800'} font-black text-lg mb-2 uppercase tracking-tight`}>{p.name}</h4>
                              <div className="flex items-end gap-1 mb-6">
                                <span className="text-4xl font-black text-stone-950">R$ {p.price}</span>
                                <span className="text-sm text-stone-500 font-bold pb-1">/{p.interval === 'month' ? 'mês' : p.interval === 'year' ? 'ano' : p.interval}</span>
                              </div>
                              <ul className="space-y-3 mb-8 flex-1">
                                {p.features?.map((f: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-xs font-bold text-stone-600">
                                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                              <button
                                onClick={() => {
                                  if (currentProjectSlug) {
                                    handleStripeCheckout(currentProjectSlug, p.name, p.priceId);
                                    setIsPlansBannerOpen(false);
                                  } else {
                                    setIsPlansBannerOpen(false);
                                    setTimeout(() => { window.location.hash = '#criarsite'; }, 50);
                                  }
                                }}
                                className={`w-full py-4 rounded-xl cursor-pointer font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 text-xs ${isAnual ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30' : 'bg-stone-900 text-white hover:bg-black shadow-lg shadow-black/20'}`}
                              >
                                <Rocket size={16} /> {currentProjectSlug ? `Assinar ${p.name}` : 'Criar meu site'}
                              </button>
                            </div>
                          );
                        })
                    ) : (
                      <div className="col-span-3 text-center py-10 text-stone-500 font-bold">Nenhum plano configurado.</div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NOVO MODAL: COMO FUNCIONA */}
      <AnimatePresence>
        {isHowItWorksOpen && (
          <div className="fixed inset-0 z-[500] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="bg-gradient-to-r from-teal-600 to-indigo-600 p-6 md:p-8 relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none"></div>
                <button onClick={() => { setIsHowItWorksOpen(false); window.location.hash = ''; }} className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer transition-colors bg-black/20 p-2 rounded-full z-10">
                  <X size={20} />
                </button>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20 text-white">
                    <Sparkles size={28} />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2 italic">Como o SiteZing Funciona</h2>
                  <p className="text-teal-50 text-sm md:text-base font-medium max-w-xl">Entenda o motor por trás da plataforma inteligente que constrói sua presença digital do zero em instantes.</p>
                </div>
              </div>

              <div className="p-6 md:p-10 overflow-y-auto space-y-8 bg-stone-50">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start gap-4 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0"><Rocket size={24} /></div>
                    <div>
                      <h4 className="font-black text-stone-900 uppercase tracking-wide mb-1">Criação por IA</h4>
                      <p className="text-xs text-stone-500 font-medium leading-relaxed">Você só digita o nome do negócio e nossa IA faz o resto: escreve textos persuasivos e monta o layout focado em vendas nas cores da sua marca.</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start gap-4 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><Gift size={24} /></div>
                    <div>
                      <h4 className="font-black text-stone-900 uppercase tracking-wide mb-1">Teste 100% Grátis</h4>
                      <p className="text-xs text-stone-500 font-medium leading-relaxed">Sinta o poder da plataforma oferecendo 7 dias de uso sem compromisso. Crie, visualize e altere sem cadastrar cartão de crédito.</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start gap-4 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Globe size={24} /></div>
                    <div>
                      <h4 className="font-black text-stone-900 uppercase tracking-wide mb-1">Seu Próprio Domínio</h4>
                      <p className="text-xs text-stone-500 font-medium leading-relaxed">Conecte facilmente o seu `.com.br` no painel. O SiteZing injeta certificados SSL (Cadeado ✅) e provisiona as rotas na hora com um clique.</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start gap-4 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0"><Zap size={24} /></div>
                    <div>
                      <h4 className="font-black text-stone-900 uppercase tracking-wide mb-1">Hospedagem Inclusa</h4>
                      <p className="text-xs text-stone-500 font-medium leading-relaxed">Esqueça configurações complicadas. Seu site é hospedado nativamente no Google Cloud Platform, garantindo velocidade estelar 24/7.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-stone-200 bg-white grid place-items-center flex-shrink-0">
                <button
                  onClick={() => {
                    setIsHowItWorksOpen(false);
                    setTimeout(() => { window.location.hash = '#criarsite'; }, 50);
                  }}
                  className="w-full md:max-w-md bg-stone-950 hover:bg-black text-white py-4 rounded-xl cursor-pointer font-black uppercase tracking-[0.1em] text-sm shadow-xl shadow-stone-900/20 hover:-translate-y-1 transition-all flex justify-center items-center gap-2"
                >
                  <Sparkles size={18} className="text-orange-400" /> Crie seu site agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CANCELAMENTO */}
      <AnimatePresence>
        {cancelModalProject && (
          <div className="fixed inset-0 z-[500] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-red-100"
            >
              <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100 relative">
                <button onClick={() => setCancelModalProject(null)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors">
                  <X size={18} />
                </button>
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3"><AlertCircle size={24} /></div>
                <h3 className="text-lg font-black text-red-900 mb-1 uppercase tracking-wider">Cancelar Assinatura?</h3>
                <p className="text-xs text-red-700/80 font-medium">Você perderá os benefícios ao final do ciclo atual.</p>
              </div>

              <div className="p-6 bg-white space-y-4">
                <div className="bg-red-50/50 p-4 border border-red-100 rounded-xl space-y-2">
                  <p className="text-[11px] text-stone-600 uppercase font-black">Atenção:</p>
                  <ul className="text-xs text-stone-500 list-none space-y-1.5">
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />O site continuará online até o fim do período já pago.</li>
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />Após o vencimento, o site será <strong className="text-stone-700">Congelado</strong>.</li>
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />Você não será mais cobrado nos próximos meses.</li>
                  </ul>
                </div>

                <label className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500" checked={cancelTermsAccepted} onChange={(e) => setCancelTermsAccepted(e.target.checked)} />
                  <span className="text-[11px] font-bold text-stone-600 leading-relaxed">Estou ciente de que meu site será suspenso ao fim do ciclo atual.</span>
                </label>
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100 flex gap-2">
                <button onClick={() => setCancelModalProject(null)} className="flex-1 py-3 px-2 bg-white border border-stone-200 text-stone-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors">Voltar</button>
                <button
                  onClick={() => handleConfirmCancel(cancelModalProject)}
                  disabled={!cancelTermsAccepted || isCanceling}
                  className="flex-1 py-3 px-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  {isCanceling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Cancelamento'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CRIAÇÃO "PERFEITO" (RESTAURADO E OTIMIZADO) */}
      <AnimatePresence>
        {showFloatModal && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
              onClick={() => setShowFloatModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white/95 backdrop-blur-2xl w-full max-w-xl rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.25)] border border-white/50 relative overflow-hidden flex flex-col"
            >
              {/* Header Premium */}
              <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-black p-8 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -ml-20 -mb-20"></div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                  </div>
                  <button onClick={() => setShowFloatModal(false)} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all active:scale-90">
                    <X size={20} />
                  </button>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">Configure seu novo site</h3>
                <p className="text-sm text-stone-400 font-medium">Preencha os dados abaixo ou deixe o Google fazer a mágica.</p>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar scroll-smooth">
                {/* FIELD 1: GOOGLE SYNC */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20">1</div>
                    <label className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em]">Sincronizar com Google AI</label>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4" />
                        <input 
                          type="text" 
                          placeholder="Link ou Nome da Empresa no Google" 
                          value={googleSearchQuery}
                          onChange={(e) => {
                            setGoogleSearchQuery(e.target.value);
                            setGoogleStatus(null);
                            setGoogleResults([]);
                            if (e.target.value === '') setPendingGoogleData(null);
                          }}
                          className="w-full bg-white border-2 border-stone-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:border-blue-500 outline-none text-stone-800 transition-all shadow-sm" 
                        />
                      </div>
                      <button 
                        onClick={() => fetchGoogleData(false, googleSearchQuery)}
                        disabled={isFetchingGoogle || googleSearchQuery.length < 3}
                        className="bg-blue-600 hover:bg-black text-white px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                      >
                        {isFetchingGoogle ? <Loader2 className="animate-spin w-4 h-4" /> : "Pesquisar"}
                      </button>
                    </div>
                  </div>

                  {googleStatus && (
                    <div className={`text-xs p-4 rounded-2xl font-bold flex items-center gap-3 animate-in slide-in-from-top-2 border ${googleStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {googleStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                      {googleStatus.msg}
                    </div>
                  )}

                  {googleResults.length > 0 && !pendingGoogleData && (
                    <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                      {googleResults.slice(0, 3).map((res, i) => (
                        <div 
                          key={i}
                          onClick={() => {
                            setPendingGoogleData(res);
                            setGoogleResults([]);
                            setFormData(prev => ({
                              ...prev,
                              businessName: res.name || prev.businessName,
                            }));
                            const newSlug = slugify(res.name || '').slice(0, 30);
                            setFormData(p => ({ ...p, customSlug: newSlug }));
                            checkDomainDebounced(newSlug);
                          }}
                          className="bg-white border-2 border-stone-100 hover:border-blue-600 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-sm flex items-start gap-4 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <MapPin size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-black text-stone-900 uppercase italic truncate">{res.name}</h5>
                            <p className="text-[10px] text-stone-500 font-medium truncate mt-0.5">{res.address}</p>
                          </div>
                          <ArrowRight size={16} className="text-stone-300 self-center group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingGoogleData && (
                    <div className="bg-emerald-50 border-2 border-emerald-500/30 p-5 rounded-[2rem] animate-in zoom-in duration-300 relative overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <Check size={20} />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-[11px] font-black text-stone-900 uppercase italic truncate tracking-tight">{pendingGoogleData.name}</h5>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sincronizado via Google</span>
                        </div>
                        <button onClick={() => setPendingGoogleData(null)} className="text-[9px] font-black text-stone-400 uppercase hover:text-red-500 transition-colors">Trocar</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  {/* FIELD 2 & 3: NAME & DESCRIPTION */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-orange-500/20">2</div>
                        <label className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em]">Dados do Negócio</label>
                      </div>
                      <div className="space-y-4">
                        <div className="group/input">
                          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Nome Fantasia</p>
                          <input 
                            type="text" 
                            placeholder="Ex: Pizzaria Mágica" 
                            value={formData.businessName}
                            onChange={(e) => {
                              setFormData(p => ({ ...p, businessName: e.target.value }));
                              if (!formData.isCustomSlugEdited) {
                                const s = slugify(e.target.value).slice(0, 30);
                                setFormData(p => ({ ...p, customSlug: s }));
                                checkDomainDebounced(s);
                              }
                            }}
                            className="w-full bg-stone-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm focus:border-orange-500 focus:bg-white outline-none text-stone-800 font-bold transition-all shadow-inner" 
                          />
                        </div>
                        <div className="group/input">
                          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">O que você faz?</p>
                          <textarea 
                            placeholder="Ex: Pizzaria napolitana com bordas recheadas e delivery rápido."
                            value={formData.description}
                            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                            className="w-full bg-stone-50 border-2 border-transparent rounded-2xl px-5 py-4 text-sm focus:border-orange-500 focus:bg-white outline-none text-stone-800 font-bold resize-none h-24 transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FIELD 4: DOMAIN CHECKER */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-emerald-500/20">4</div>
                        <label className="text-[11px] font-black text-stone-900 uppercase tracking-[0.2em]">Endereço na Web</label>
                      </div>
                      <div className="bg-stone-50 border-2 border-dashed border-stone-200 p-6 rounded-[2.5rem] relative group">
                        <div className="space-y-4">
                          <div className="flex items-center bg-white border-2 border-stone-100 rounded-2xl px-4 py-4 shadow-sm group-focus-within:border-emerald-500 transition-all">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-tight shrink-0 whitespace-nowrap">sitezing.com/</span>
                            <input 
                              type="text"
                              value={formData.customSlug}
                              onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                setFormData(p => ({ ...p, customSlug: val, isCustomSlugEdited: true }));
                                checkDomainDebounced(val);
                              }}
                              className="w-full bg-transparent outline-none text-sm font-black text-stone-900 px-1"
                              placeholder="seu-negocio"
                            />
                            {floatDomainStatus.loading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                            ) : formData.customSlug && (
                              floatDomainStatus.available ? (
                                <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check size={12} /></div>
                              ) : (
                                <div className="bg-red-100 text-red-600 p-1 rounded-full"><X size={12} /></div>
                              )
                            )}
                          </div>

                          <div className="px-2">
                             {floatDomainStatus.available === true && (
                               <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">✨ Endereço Disponível!</p>
                             )}
                             {floatDomainStatus.available === false && (
                               <div className="space-y-2">
                                 <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Endereço já em uso</p>
                                 <div className="flex flex-wrap gap-1.5">
                                   {floatDomainStatus.alternatives?.map((alt, idx) => (
                                     <button 
                                       key={idx}
                                       onClick={() => {
                                         setFormData(p => ({ ...p, customSlug: alt }));
                                         checkDomainDebounced(alt);
                                       }}
                                       className="text-[8px] font-black uppercase tracking-tighter bg-white border border-stone-200 px-2 py-1 rounded-lg text-stone-600 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                                     >
                                       {alt}
                                     </button>
                                   ))}
                                 </div>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => {
                      if (pendingGoogleData) confirmGoogleInjection();
                      else handleGenerateSite();
                    }}
                    disabled={isGenerating || !formData.businessName || !formData.customSlug || floatDomainStatus.available === false}
                    className="w-full py-6 rounded-3xl bg-black text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-black/20 transition-all active:scale-[0.98] flex items-center justify-center gap-4 hover:bg-stone-900 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin w-5 h-5" /> EXECUTANDO MÁGICA...
                      </div>
                    ) : (
                      <>✨ INICIAR MÁGICA AGORA</>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-stone-50 border-t border-stone-100 flex items-center justify-center gap-8 flex-shrink-0">
                 <div className="flex items-center gap-2 opacity-40">
                   <ShieldCheck size={16} className="text-stone-900" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-900 leading-none">Ambiente Seguro</span>
                 </div>
                 <div className="flex items-center gap-2 opacity-40">
                   <Zap size={16} className="text-stone-900" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-900 leading-none">Geração 30s</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE SUCESSO DE PUBLICAÇÃO */}
      <AnimatePresence>
        {publishModalUrl && (
          <div className="fixed inset-0 z-[5000] bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] overflow-hidden max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setPublishModalUrl(null)} className="absolute top-4 right-4 bg-stone-100 hover:bg-stone-200 text-stone-500 p-2 rounded-full transition-colors z-[5010]">
                <X size={20} />
              </button>

              <div className="p-8 pb-8 text-center bg-gradient-to-b from-emerald-50 to-white">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                  {isUpdatePublish ? <RefreshCw className="w-10 h-10 text-emerald-500" /> : <Globe className="w-10 h-10 text-emerald-500" />}
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-stone-900 mb-2">
                  {isUpdatePublish ? 'Atualização no Ar!' : 'Seu Site está no Ar!'}
                </h2>
                <p className="text-sm text-stone-500 font-medium">
                  {isUpdatePublish
                    ? 'Suas alterações foram publicadas com sucesso e já estão refletindo no seu endereço oficial:'
                    : 'Parabéns! O projeto foi implantado e já pode ser acessado em todo o mundo através do link abaixo:'
                  }
                </p>

                <div className="mt-6 bg-stone-100 border border-stone-200 rounded-xl p-4 flex items-center justify-between gap-3 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
                  <span className="font-mono text-emerald-700 font-bold truncate flex-1 text-left select-all">{publishModalUrl}</span>
                  <a href={publishModalUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white border border-stone-200 p-2 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-stone-50 transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500">
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              <div className="px-8 pb-8 bg-white">
                {(() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  const isDomainActive = currentProject?.domainStatus === 'ACTIVE' || currentProject?.domainStatus === 'HOSTING_ACTIVE';
                  const isPaid = currentProject?.paymentStatus === 'paid';
                  let daysLeft = 7;
                  if (currentProject?.expiresAt) {
                    const expDate = getExpirationTimestampMs(currentProject.expiresAt);
                    if (typeof expDate === 'number' && !Number.isNaN(expDate)) {
                      daysLeft = Math.ceil((expDate - Date.now()) / (1000 * 3600 * 24));
                    }
                  }

                  return (
                    <>
                      <div className={`mb-6 p-4 rounded-2xl border flex flex-col gap-2 ${isDomainActive ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center justify-between">
                          <h4 className={`font-black text-xs uppercase flex items-center gap-2 ${isDomainActive ? 'text-blue-800' : 'text-amber-800'}`}>
                            <ShieldCheck size={16} /> Status do SSL
                          </h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isDomainActive ? 'bg-blue-200 text-blue-900' : 'bg-amber-200 text-amber-900 animate-pulse'}`}>
                            {isDomainActive ? 'Ativo ✅' : 'Gerando... ⏳'}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-relaxed font-medium ${isDomainActive ? 'text-blue-700/80' : 'text-amber-700/80'}`}>
                          O certificado de segurança pode levar até 24h para ser totalmente propagado (Limpe o cache do navegador se necessário).
                        </p>
                      </div>

                      {!isPaid && (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6 shadow-inner relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-xl rounded-full pointer-events-none"></div>
                          <h4 className="flex items-center gap-2 text-orange-800 font-black text-sm uppercase tracking-wider mb-2 relative z-10"><Zap size={18} className="text-orange-500" /> Benefício 7 Dias Grátis</h4>
                          <p className="text-xs text-orange-700/90 leading-relaxed font-medium mb-3 relative z-10">Você ganha <strong className="text-orange-900 bg-orange-200/50 px-1.5 py-0.5 rounded">{Math.max(0, daysLeft)} dias restantes</strong> de navegação pública e hospedagem irrestrita.</p>
                          <ul className="text-[11px] text-orange-800/80 space-y-2 font-medium relative z-10">
                            <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 shrink-0" /> Após o teste, seu site será gentilmente congelado mantendo seus dados salvos.</li>
                            <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 shrink-0" /> Assine agora para manter no ar e liberar domínio personalizado.</li>
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            setPublishModalUrl(null);
                            setActiveTab('assinatura');
                            setIsMenuOpen(true);
                          }}
                          className={`w-full ${!isPaid ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-stone-900 hover:bg-black shadow-stone-900/30'} text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg text-xs`}
                        >
                          {!isPaid ? 'Garantir Hospedagem e Domínio' : 'Ver Meu Plano'}
                        </button>
                        <button
                          onClick={() => setPublishModalUrl(null)}
                          className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 py-3 rounded-xl font-bold uppercase tracking-wider transition-colors text-xs"
                        >
                          Fechar e Voltar ao Painel
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL LEMBRETE PARA SALVAR PÓS-CRIAÇÃO */}
      <AnimatePresence>
        {isSaveReminderOpen && (
          <div className="fixed inset-0 z-[600] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] overflow-hidden max-w-[380px] w-full shadow-2xl relative border border-orange-100"
            >
              <div className="bg-orange-50 p-8 flex flex-col items-center text-center border-b border-orange-100 relative">
                <button onClick={() => setIsSaveReminderOpen(false)} className="absolute top-4 right-4 text-orange-400 hover:text-orange-600 transition-colors p-2 rounded-full hover:bg-orange-100/50">
                  <X size={18} />
                </button>
                <div className="w-16 h-16 bg-white text-orange-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-orange-200">
                  <Save size={32} />
                </div>
                <h3 className="text-xl font-black text-stone-900 mb-1 uppercase tracking-wider">Atenção Especial!</h3>
                <p className="text-[11px] text-stone-600 font-medium uppercase tracking-widest">Ação Necessária</p>
              </div>

              <div className="p-8 bg-white space-y-5 text-center">
                <p className="text-[13px] font-medium text-stone-500 leading-relaxed">
                  Para que você não perca o projeto e para ele ser <b>publicado</b>, o servidor precisa armazená-lo formalmente agora. Em seguida, o botão de publicação será liberado!
                </p>
                <button
                  onClick={() => {
                    setIsSaveReminderOpen(false);
                    handleSaveOrUpdateSite();
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.1em] shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Salvar Projeto Agora
                </button>
                <button
                  onClick={() => setIsSaveReminderOpen(false)}
                  className="w-full bg-stone-50 hover:bg-stone-100 text-stone-500 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors mt-2"
                >
                  Salvar depois
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONTRATACAO DE PLANO / TERMOS LAB */}
      <AnimatePresence>
        {checkoutDetailsModal && (
          <div className="fixed inset-0 z-[500] bg-stone-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-[2.5rem] overflow-hidden max-w-[440px] w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative flex flex-col max-h-[90vh] border border-stone-100"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm"><ShieldCheck size={22} /></div>
                  <div>
                    <h3 className="font-black text-stone-900 uppercase text-xs tracking-[0.1em]">Finalizar Contratação</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Segurança de ponta a ponta</p>
                  </div>
                </div>
                <button onClick={() => setCheckoutDetailsModal(null)} className="text-stone-400 hover:text-stone-800 transition-colors bg-white p-2 border border-stone-200 rounded-full shadow-sm hover:rotate-90">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full"></div>
                  <h4 className="font-black text-2xl uppercase italic mb-1 relative z-10 leading-none">
                    {checkoutDetailsModal.planType || 'Plano Escolhido'}
                  </h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 relative z-10">Confirmação de Assinatura</p>

                  {(() => {
                    const plan = platformConfigs?.plans?.find((p: any) => p.priceId === checkoutDetailsModal.priceId);
                    if (plan?.allowInstallments) {
                      return (
                        <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                            <CreditCard size={14} /> Opção de Parcelamento Ativa
                          </div>
                          <p className="text-[10px] text-white/50 mt-1 font-medium">Você poderá parcelar em até {plan.maxInstallments}x no próximo passo.</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><CheckCircle2 size={18} /></div>
                    <div>
                      <h5 className="font-black text-stone-900 text-[11px] uppercase tracking-wider">Assinatura Flexível</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-1">Gestão via Stripe. Cancele com um clique no painel a qualquer momento, sem burocracia ou multas.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><Info size={18} /></div>
                    <div>
                      <h5 className="font-black text-stone-900 text-[11px] uppercase tracking-wider">Infraestrutura Imediata</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-1">Ao confirmar, alocamos processamento e SSL para seu site. Não há estorno de dias não utilizados.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100"><RefreshCw size={18} /></div>
                    <div>
                      <h5 className="font-black text-stone-900 text-[11px] uppercase tracking-wider">Continuidade Garantida</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-1">Se o pagamento falhar, seus dados ficam protegidos por 5 dias em modo de congelamento seguro.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-stone-100 bg-stone-50/80 mt-auto">
                <button
                  onClick={() => {
                    const { projectId, planType, priceId } = checkoutDetailsModal;
                    setCheckoutDetailsModal(null);
                    handleStripeCheckout(projectId, planType, priceId);
                  }}
                  className="w-full bg-stone-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-stone-900/20 text-xs flex items-center justify-center gap-2 hover:translate-y-[-2px]"
                >
                  Confirmar e Prosseguir <ChevronRight size={16} />
                </button>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 uppercase tracking-[0.15em]"><CreditCard size={12} /> Pagamento Seguro</div>
                  <div className="w-1 h-1 rounded-full bg-stone-200"></div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 uppercase tracking-[0.15em]"><ShieldCheck size={12} /> SSL 256-bit</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE INFORMAÇÕES DO TESTE GRÁTIS */}
      <AnimatePresence>
        {isTrialModalOpen && (
          <div className="fixed inset-0 z-[600] bg-stone-950/40 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-[2.5rem] overflow-hidden max-w-[480px] w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative flex flex-col max-h-[90vh] border border-stone-100"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg rotate-3"><Gift size={22} /></div>
                  <div>
                    <h3 className="font-black text-stone-900 uppercase text-xs tracking-[0.1em]">Teste Grátis SiteZing</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Sua jornada começa agora</p>
                  </div>
                </div>
                <button onClick={() => setIsTrialModalOpen(false)} className="text-stone-400 hover:text-stone-800 transition-colors bg-white p-2 border border-stone-200 rounded-full shadow-sm hover:rotate-90">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full"></div>
                  <h4 className="font-black text-2xl uppercase italic mb-1 relative z-10 leading-none">7 Dias de Liberdade</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 relative z-10">Sem cartão de crédito • Sem compromisso</p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 font-black">1</div>
                    <div>
                      <h5 className="font-black text-stone-900 text-[11px] uppercase tracking-wider">Criação Instantânea</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-1">Nossa IA monta seu site em 30 segundos com textos e imagens profissionais.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 font-black">2</div>
                    <div>
                      <h5 className="font-black text-stone-900 text-[11px] uppercase tracking-wider">Publicação Imediata</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-1">Publique seu site com um link oficial grátis e comece a divulgar seu negócio.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 font-black">3</div>
                    <div>
                      <h5 className="font-black text-stone-900 text-[11px] uppercase tracking-wider">Hospedagem Premium Grátis</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-1">Aproveite todos os recursos da nossa plataforma por 7 dias sem pagar nada.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 font-black">4</div>
                    <div>
                      <h5 className="font-black text-stone-900 text-[11px] uppercase tracking-wider">Você no Controle</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-1">Após o teste, você decide se quer continuar com um plano pago ou parar sem custos.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-stone-100 bg-stone-50/80 mt-auto">
                <button
                  onClick={() => {
                    setIsTrialModalOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/20 text-xs flex items-center justify-center gap-2 hover:translate-y-[-2px]"
                >
                  Iniciar Minha Mágica Agora <Zap size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL SUPORTE (MENSAGENS P/ ADMIN) */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <SupportModal
            onClose={() => setIsSupportModalOpen(false)}
            onSubmit={handleSupportSubmit}
          />
        )}
      </AnimatePresence>

      {/* MODAL DE PERFIL / KYC */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <ProfileForm
            initialData={userProfile}
            onSubmit={handleProfileSubmit}
            onClose={() => setIsProfileModalOpen(false)}
          />
        )}
      </AnimatePresence>
      </>
    </GlobalErrorBoundary>
  );
};

export default App;
