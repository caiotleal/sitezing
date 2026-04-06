import React, { Suspense, lazy, useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { auth, functions, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Settings, Upload, Loader2, RefreshCw, Briefcase, FileText, X, Phone, Globe, CheckCircle, CheckCircle2, Save, Trash2, AlertCircle, LayoutDashboard, MapPin, Copy, ExternalLink, Zap, Star, ShieldCheck, CreditCard, User, LogIn, Info, Sparkles, ChevronRight, Gift, Menu, HelpCircle, Palette, Check, Instagram
} from 'lucide-react';
import { TEMPLATES } from './components/templates';
const LoginPage = lazy(() => import('./components/LoginPage'));
const DomainChecker = lazy(() => import('./components/DomainChecker'));
import { useIframeEditor } from './components/useIframeEditor';

import { BRAND_LOGO } from './components/brand';
import ProfileForm from './components/ProfileForm';
import SupportModal from './components/SupportModal';

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
    .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(231, 229, 228, 0.8); transition: all 0.3s ease; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05); position: relative; }
    .glass-card:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 20px 40px -10px rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.3); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .animate-up { animation: fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    .plan-bg-logo { position: absolute; bottom: -15%; right: -10%; width: 70%; height: auto; opacity: 0.03; pointer-events: none; filter: grayscale(100%); }
    
    @keyframes zingPulse { 0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(249, 115, 22, 0); } 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); } }
    .share-float-btn { position: fixed; bottom: 100px; right: 40px; z-index: 100; background: #f97316; color: white; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(249,115,22,0.4); cursor: pointer; animation: zingPulse 2s infinite; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .share-float-btn:hover { transform: scale(1.1) rotate(15deg); background: #ea580c; }
    .card-share-btn { position: absolute; bottom: 20px; right: 20px; width: 32px; height: 32px; background: #f5f5f4; color: #78716c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; opacity: 0; transform: translateY(10px); transition: all 0.3s ease; z-index: 20; }
    .glass-card:hover .card-share-btn { opacity: 1; transform: translateY(0); }
    .card-share-btn:hover { background: #f97316; color: white; }

    @media (min-width: 1024px) {
      body { display: block; }
      main { padding: 0 8% !important; margin: 0 !important; }
      header { height: 80px !important; }
      .footer-commercial { height: 80px; }
    }
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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

    // Hero Creation Form Communication
    window.addEventListener('message', function(e) {
      if (!e.data || e.data.type !== 'SYNC_STATE') return;
      
      var data = e.data;
      var domainStatus = data.domainStatus;
      var isFetchingGoogle = data.isFetchingGoogle;
      var googleStatus = data.googleStatus;
      var pendingGoogleData = data.pendingGoogleData;
      var formData = data.formData;
      
      // Update Google Feedback & Confirmation Box
      var gFeed = document.getElementById('google-feedback');
      var gConfirm = document.getElementById('google-confirm-box');
      if (gFeed) {
        if (isFetchingGoogle) {
          gFeed.style.display = 'block';
          gFeed.className = 'text-[10px] mt-1 ml-1 font-bold text-orange-500 animate-pulse';
          gFeed.innerText = 'Buscando no Google...';
          if (gConfirm) gConfirm.style.display = 'none';
        } else if (pendingGoogleData) {
          gFeed.style.display = 'none';
          if (gConfirm) {
            gConfirm.style.display = 'block';
            document.getElementById('conf-name').innerText = pendingGoogleData.name;
            document.getElementById('conf-addr').innerText = pendingGoogleData.address;
          }
        } else if (googleStatus) {
          gFeed.style.display = 'block';
          gFeed.className = 'text-[10px] mt-1 ml-1 font-bold ' + (googleStatus.type === 'success' ? 'text-emerald-500' : 'text-red-500');
          gFeed.innerText = googleStatus.msg;
          if (gConfirm) gConfirm.style.display = 'none';
        } else {
          gFeed.style.display = 'none';
          if (gConfirm) gConfirm.style.display = 'none';
        }
      }

      // Update Inputs (Avoid overwriting while typing)
      var nameInput = document.getElementById('hero-business-name');
      if (nameInput && formData.businessName && document.activeElement !== nameInput) {
        nameInput.value = formData.businessName;
      }

      var descInput = document.getElementById('hero-business-desc');
      if (descInput && formData.description && document.activeElement !== descInput) {
        descInput.value = formData.description;
      }
      
      var slugInput = document.getElementById('hero-custom-slug');
      if (slugInput && formData.customSlug && document.activeElement !== slugInput) {
        slugInput.value = formData.customSlug;
      }

      // Update Slug Feedback
      var sFeed = document.getElementById('slug-feedback');
      if (sFeed) {
        if (domainStatus.loading) {
          sFeed.innerText = 'Validando endereço...';
          sFeed.className = 'text-[10px] mt-1 ml-1 font-bold text-stone-400 animate-pulse italic';
        } else if (domainStatus.available === true) {
          sFeed.innerText = '✓ Endereço disponível!';
          sFeed.className = 'text-[10px] mt-1 ml-1 font-bold text-emerald-500 italic';
        } else if (domainStatus.available === false) {
          sFeed.innerText = '✗ Indisponível. Sugestão: ' + (domainStatus.slug || '');
          sFeed.className = 'text-[10px] mt-1 ml-1 font-bold text-red-500 italic';
        }
      }
    });

    document.addEventListener('DOMContentLoaded', function() {
      var busName = document.getElementById('hero-business-name');
      if (busName) {
        var phrases = ["Ex: Pizzaria do Chef", "Ex: Clínica Sorriso", "Ex: Advocacia Silva", "Ex: Barbearia Vip"];
        var idx = 0; var charIdx = 0; var isDeleting = false; var typeTimer;
        function typePlaceholder() {
          if (document.activeElement === busName || busName.value !== "") {
            busName.setAttribute('placeholder', 'Qual o Nome do Seu Negócio?');
            return;
          }
          var currentPhrase = phrases[idx];
          if (isDeleting) {
            busName.setAttribute('placeholder', currentPhrase.substring(0, charIdx - 1) + '|');
            charIdx--;
            if (charIdx === 0) { isDeleting = false; idx = (idx + 1) % phrases.length; typeTimer = setTimeout(typePlaceholder, 600); }
            else { typeTimer = setTimeout(typePlaceholder, 40); }
          } else {
            busName.setAttribute('placeholder', currentPhrase.substring(0, charIdx + 1) + '|');
            charIdx++;
            if (charIdx === currentPhrase.length) { isDeleting = true; typeTimer = setTimeout(typePlaceholder, 1500); }
            else { typeTimer = setTimeout(typePlaceholder, 80); }
          }
        }
        typeTimer = setTimeout(typePlaceholder, 1000);

        busName.addEventListener('focus', function() {
          clearTimeout(typeTimer);
          busName.setAttribute('placeholder', 'Qual o Nome do Seu Negócio?');
        });
        busName.addEventListener('blur', function() {
          if (!busName.value) { idx = 0; charIdx = 0; isDeleting = false; typeTimer = setTimeout(typePlaceholder, 500); }
        });

        busName.addEventListener('input', function(e) {
          window.parent.postMessage({ type: 'SET_BUSINESS_NAME', value: e.target.value }, '*');
        });
      }

      var busDesc = document.getElementById('hero-business-desc');
      if (busDesc) busDesc.addEventListener('input', function(e) {
        window.parent.postMessage({ type: 'SET_BUSINESS_DESC', value: e.target.value }, '*');
      });

      var custSlug = document.getElementById('hero-custom-slug');
      if (custSlug) custSlug.addEventListener('input', function(e) {
        window.parent.postMessage({ type: 'SET_CUSTOM_SLUG', value: e.target.value }, '*');
      });

      var googSearch = document.getElementById('hero-google-search');
      if (googSearch) googSearch.addEventListener('change', function(e) {
        window.parent.postMessage({ type: 'SET_GOOGLE_URL', value: e.target.value }, '*');
      });

      var googBtn = document.getElementById('hero-google-btn');
      if (googBtn) googBtn.addEventListener('click', function() {
        var val = document.getElementById('hero-google-search').value;
        window.parent.postMessage({ type: 'TRIGGER_FETCH_GOOGLE', value: val }, '*');
      });

      var confBtn = document.getElementById('hero-google-confirm');
      if (confBtn) confBtn.addEventListener('click', function() {
        window.parent.postMessage({ type: 'ACTION_CONFIRM_GOOGLE' }, '*');
      });

      var resetBtn = document.getElementById('hero-google-reset');
      if (resetBtn) resetBtn.addEventListener('click', function() {
        window.parent.postMessage({ type: 'ACTION_RESET_GOOGLE' }, '*');
      });

      var subBtn = document.getElementById('hero-submit-btn');
      if (subBtn) subBtn.addEventListener('click', function() {
        window.parent.postMessage({ type: 'ACTION_START_MAGIC' }, '*');
      });
    });
  </script>
</head>
<body class="antialiased selection:bg-orange-500 selection:text-white">
  <div class="share-float-btn" onclick="zingShare()" title="Compartilhar SiteZing">
    <i class="fas fa-share-alt text-2xl"></i>
  </div>

  <header class="fixed top-0 left-0 w-full z-[80] bg-[#FAFAF9]/80 backdrop-blur-md border-b border-stone-200/60 h-20 flex items-center px-6 md:px-20 transition-all">
    <div class="w-full mx-auto flex items-center justify-between">
       <img src="${BRAND_LOGO}" alt="SiteZing Logo" class="h-10 md:h-14 w-auto drop-shadow-sm" />
       <div onclick="zingShare()" class="cursor-pointer bg-white border border-stone-200 w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:text-orange-500 hover:border-orange-500 transition-all shadow-sm">
         <i class="fas fa-share-alt"></i>
       </div>
    </div>
  </header>

  <main class="pt-8 pb-8 px-6 md:px-20 w-full mx-auto flex flex-col min-h-screen relative">
    <div class="h-16 md:h-20 w-full"></div>
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-200/30 blur-[150px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-200/30 blur-[150px] rounded-full pointer-events-none"></div>
    
    <div class="grid md:grid-cols-[1fr_340px] gap-16 items-center relative z-10 animate-up mb-12 mt-6 md:mt-10">
      <div class="text-center md:text-left">
        <h1 class="text-[2.8rem] md:text-[6.2rem] font-black leading-[0.8] tracking-tighter mb-6 uppercase italic text-stone-900 drop-shadow-sm w-full">
          Seu site pronto em um <span class="text-orange-500 pr-10 inline-block drop-shadow-sm">ZING!!!</span>
        </h1>
        <p class="text-base md:text-xl text-stone-500 font-light leading-relaxed max-w-2xl hidden md:block mb-8">
          A nossa inteligência artificial cria, escreve e publica o seu site automaticamente. <span class="font-bold text-stone-800 text-lg">Preencha e veja a mágica acontecer agora mesmo.</span>
        </p>
        
        <div class="flex flex-col md:flex-row items-center gap-6 bg-white/70 border-2 border-orange-100 p-6 md:p-8 rounded-[2.5rem] mt-8 max-w-fit mx-auto md:mx-0 shadow-2xl hover:border-orange-300 transition-all group">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-6 transition-transform">
              <i class="fas fa-gift text-2xl"></i>
            </div>
            <div class="text-left">
              <h3 class="text-lg md:text-2xl font-black text-stone-900 uppercase italic leading-tight">7 dias grátis para testar</h3>
              <p class="text-xs md:text-sm text-stone-500 font-bold uppercase tracking-widest">Sem compromisso • Ativação Imediata</p>
            </div>
          </div>
          <button onclick="window.parent.postMessage({ type: 'OPEN_TRIAL_MODAL' }, '*')" class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-2xl font-black uppercase italic tracking-wider text-xs shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2">
            Saber Mais <i class="fas fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </div>

      <!-- Formulário de Criação (Zing Style Compacto) -->
      <div class="w-full max-w-[340px] bg-white border border-stone-200 shadow-2xl rounded-[2.5rem] overflow-hidden relative mx-auto md:ml-auto md:mr-0 animate-up" style="animation-delay: 0.1s;">
        <div class="bg-gradient-to-r from-teal-600 to-indigo-600 p-3 pt-4 relative text-center">
          <div class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-1.5 backdrop-blur-md border border-white/20">
            <i class="fas fa-rocket text-yellow-300 text-xs"></i>
          </div>
          <h3 class="text-xs font-black text-white italic uppercase tracking-wider">Crie em 30 Segundos</h3>
        </div>
        
        <div class="p-5 pb-6">
          <div class="space-y-3">
            <!-- Passo 1: Google -->
            <div class="bg-blue-50/40 p-3 border border-blue-100 rounded-2xl relative overflow-hidden">
              <label class="text-[8px] uppercase tracking-widest font-black text-blue-800 mb-2 flex items-center justify-center gap-1.5"><i class="fas fa-map-marker-alt"></i> Importar do Google</label>
              <div class="flex flex-col gap-1.5 relative z-10">
                <div class="relative">
                  <input type="text" id="hero-google-search" placeholder="Maps ou Nome da Empresa" 
                         class="w-full bg-white border border-blue-200 rounded-xl text-center px-3 py-2 text-[10px] font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none text-stone-800 shadow-sm" />
                  <button id="hero-google-btn" class="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg transition-all shadow-md"><i class="fas fa-search text-[10px]"></i></button>
                </div>
                <div id="google-feedback" class="text-[8px] mt-1 text-center font-bold hidden"></div>
                
                <!-- Confirmation Box (Zing Style) -->
                <div id="google-confirm-box" class="mt-2 hidden animate-up">
                  <div class="bg-white p-2.5 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center text-center">
                    <i class="fas fa-check-circle text-emerald-500 mb-1 text-xs"></i>
                    <p id="conf-name" class="text-[9px] text-stone-800 font-bold mb-0.5 truncate w-full"></p>
                    <p id="conf-addr" class="text-[8px] text-stone-500 font-medium mb-2 line-clamp-1 leading-tight"></p>
                    <div class="flex gap-1.5 w-full">
                      <button id="hero-google-reset" class="flex-1 py-1 bg-stone-100 text-stone-500 rounded-lg text-[8px] uppercase font-black hover:bg-stone-200 transition-colors">Trocar</button>
                      <button id="hero-google-confirm" class="flex-[1.5] py-1 bg-emerald-600 text-white rounded-lg text-[8px] uppercase font-black shadow-md hover:bg-emerald-500">Puxar Tudo</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Manual Inputs -->
            <div>
              <input type="text" id="hero-business-name" placeholder="Qual o Nome do Seu Negócio?" 
                     class="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-center text-[11px] focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none text-stone-800 font-bold" />
            </div>

            <div>
              <textarea id="hero-business-desc" placeholder="Descreva seu negócio (Opcional)" rows="2"
                     class="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-center text-[11px] focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none text-stone-800 font-bold resize-none"></textarea>
            </div>

            <div>
              <div class="flex bg-white border border-stone-200 rounded-xl overflow-hidden focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all shadow-sm">
                <input id="hero-custom-slug" class="flex-1 bg-transparent px-3 py-3 text-[11px] font-mono font-bold text-teal-600 outline-none w-full text-right placeholder:text-stone-300" placeholder="meu-site" />
                <span class="bg-stone-50 border-l border-stone-200 px-2 py-3 text-[10px] font-bold text-stone-400 flex items-center select-none shadow-inner">.sitezing.com.br</span>
              </div>
              <div id="slug-feedback" class="text-[9px] mt-1 text-center font-bold italic"></div>
            </div>

            <button id="hero-submit-btn" class="w-full bg-[#18181b] hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl hover:translate-y-[-1px] mt-1 flex items-center justify-center gap-2">
              INICIAR A MÁGICA ✨
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-6 relative z-10 animate-up" style="animation-delay: 0.2s;">
      <!-- PRICING_CARDS -->
    </div>

    <!-- Seção de Depoimentos (Google Reviews) -->
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
        <!-- REVIEWS_START -->
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
        <!-- REVIEWS_END -->
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
  if (!platformConfigs) return PROMO_HTML;

  let html = PROMO_HTML;
  
  // Geração de Cards de Preço Dinâmicos
  const plans = [...(platformConfigs.plans || [])].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
  let cardsHtml = ``;

  plans.forEach((p: any) => {
    const intervalLabel = 
      p.interval === 'month' ? 'mês' : 
      p.interval === 'bimestral' ? 'bimestre' :
      p.interval === 'trimestral' ? 'trimestre' :
      p.interval === 'semestral' ? 'semestre' : 
      p.interval === 'year' ? 'ano' : 'período';
    console.log(`[DEBUG] Rendering plan ${p.name} with interval: ${p.interval} -> ${intervalLabel}`);
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

  html = html.replace('<!-- PRICING_CARDS -->', cardsHtml);

  // Banner e Decorações Temáticas
  if (platformConfigs.marketing?.bannerActive) {
    const type = platformConfigs.marketing.bannerType || 'info';
    const text = platformConfigs.marketing.bannerText || '';
    let decoHtml = '';
    let extraCss = '';

    if (type === 'christmas') {
      // Cordão de luzes e chapéu no logo
      decoHtml = `
        <!-- Luzes Penduradas -->
        <div style="position: fixed; top: 90px; left: 0; width: 100%; height: 40px; z-index: 85; pointer-events: none; overflow: hidden;">
          <svg width="100%" height="100%" viewBox="0 0 1200 40" preserveAspectRatio="none">
            <path d="M0,10 Q150,40 300,10 T600,10 T900,10 T1200,10" fill="none" stroke="#064e3b" stroke-width="2"/>
            ${[20, 150, 280, 450, 580, 750, 880, 1050, 1150].map((x, i) => `
              <circle cx="${x}" cy="${i % 2 === 0 ? 25 : 15}" r="4" fill="${['#ff0000', '#00ff00', '#ffff00', '#ffffff'][i % 4]}" class="christmas-light"/>
            `).join('')}
          </svg>
        </div>
        <!-- Texto no Vão -->
        <div style="position: fixed; top: 96px; left: 0; width: 100%; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 70; pointer-events: none;">
          <span style="background: rgba(239, 68, 68, 0.9); color: white; padding: 4px 16px; border-radius: 20px; font-size: 11px; font-weight: 900; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.3); text-transform: uppercase;">
             <i class="fas fa-snowflake mr-2"></i> ${text}
          </span>
        </div>
      `;
      extraCss = `
        @keyframes lightBlink { 0%, 100% { opacity: 1; filter: brightness(1.5) drop-shadow(0 0 5px currentColor); } 50% { opacity: 0.5; filter: brightness(1); } }
        .christmas-light { animation: lightBlink 1s infinite alternate; }
        .christmas-light:nth-child(2n) { animation-delay: 0.5s; }
      `;
    } else if (type === 'black-friday') {
      // Fita Neon e Badge
      decoHtml = `
        <div style="position: fixed; top: 96px; left: 0; width: 100%; height: 32px; z-index: 70; pointer-events: none; display: flex; align-items: center; justify-content: center;">
          <div style="height: 2px; width: 100%; background: #f97316; position: absolute; box-shadow: 0 0 15px #f97316; opacity: 0.5;"></div>
          <span class="bf-badge" style="background: #000; color: #f97316; border: 1px solid #f97316; padding: 4px 20px; border-radius: 4px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 0 20px rgba(249,115,22,0.4); position: relative; z-index: 2;">
            <i class="fas fa-bolt mr-2"></i> ${text}
          </span>
        </div>
       `;
      extraCss = `
        @keyframes bfPulse { 0%, 100% { box-shadow: 0 0 10px #f97316; transform: scale(1); } 50% { box-shadow: 0 0 25px #f97316; transform: scale(1.05); } }
        .bf-badge { animation: bfPulse 2s infinite ease-in-out; }
       `;
    } else {
      // Banner Info/Warning padrão no vão
      const bgColor = type === 'warning' ? '#f97316' : '#3b82f6';
      decoHtml = `
        <div style="position: fixed; top: 96px; left: 0; width: 100%; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 70; pointer-events: none;">
          <div style="background: ${bgColor}; color: white; padding: 4px 16px; border-radius: 99px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);">
            ${text}
          </div>
        </div>
      `;
    }

    const bannerStyles = `
      <style>
        ${extraCss}
        /* Garantir que o header original continue no topo 0 sem empurrar nada */
        header { border-bottom: none !important; }
        .promo-overlay { pointer-events: none; }
      </style>
    `;
    html = html.replace(/<\/head>/i, `${bannerStyles}</head>`);
    html = html.replace(/<body[^>]*>/i, (match) => `${match}${decoHtml}`);
  }

  // Injeção de Reviews Reais
  if (platformConfigs.reviews && platformConfigs.reviews.length > 0) {
    const reviewsHtml = platformConfigs.reviews.slice(0, 3).map((r: any) => `
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
    html = html.replace(/<!-- REVIEWS_START -->([\s\S]*?)<!-- REVIEWS_END -->/i, `<!-- REVIEWS_START -->${reviewsHtml}<!-- REVIEWS_END -->`);
  }

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

        document.getElementById('btn-img-delete').addEventListener('click', () => {
          if (currentImgTarget) { 
            currentImgTarget.innerHTML = '<i class="fas fa-camera text-4xl mb-3"></i><span class="text-xs font-bold uppercase tracking-widest">Adicionar Imagem (Opcional)</span>';
            sendCleanHtml(); 
            imgToolbar.style.display = 'none';
          }
        });

        window.addEventListener('message', (e) => {
          if (e.data.type === 'INSERT_IMAGE') {
            const targetEl = document.querySelector(\`.editable-image[data-id="\${e.data.targetId}"]\`);
            if (targetEl) {
              targetEl.innerHTML = \`<img src="\${e.data.url}" class="w-full h-full block object-contain" style="border-radius: inherit; margin: 0; box-shadow: none;" />\`;
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
      <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent ${
        isBottom ? 'top-[-6px] border-b-[6px] border-b-stone-800/95' : 'bottom-[-6px] border-t-[6px] border-t-stone-800/95'
      }`}></div>
      <Sparkles size={12} className="shrink-0 text-orange-400" />
      {text}
    </motion.div>
  );
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

  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const [activeTab, setActiveTab] = useState<'geral' | 'dominio' | 'assinatura' | 'plataforma'>('geral');
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
  const [isDnsModalOpen, setIsDnsModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileWizardStep, setMobileWizardStep] = useState(1);
  const [isMobileWizardOpen, setIsMobileWizardOpen] = useState(true);
  const [mobileActiveTab, setMobileActiveTab] = useState<'editar' | 'plano'>('editar');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    businessName: '', description: '', region: '', whatsapp: '', instagram: '', facebook: '', linkedin: '', tiktok: '',
    ifood: '', noveNove: '', keeta: '', phone: '', email: '', address: '', showMap: true,
    showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa',
    logoBase64: '', logoSize: 40, segment: '', googlePlaceUrl: '', showReviews: false, reviews: [] as any[], editorialSummary: '',
    customSlug: '', isCustomSlugEdited: false, googlePhotos: [] as string[],
    headerLayout: 'logo_left_icons_right',
    manualCss: ''
  });
  const [pendingSave, setPendingSave] = useState(false);
  const [isSaveReminderOpen, setIsSaveReminderOpen] = useState(false);

  const [showFloatModal, setShowFloatModal] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isPlansBannerOpen, setIsPlansBannerOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

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

  const [floatDomainStatus, setFloatDomainStatus] = useState<{ loading: boolean; available?: boolean; slug?: string; alternatives?: string[] }>({ loading: false });
  const floatCheckTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);
  const [guideStep, setGuideStep] = useState(0);

  const nextGuideStep = (step: number) => {
    if (guideStep < step) setGuideStep(step);
  };

  const fetchGoogleData = async () => {
    if (!formData.googlePlaceUrl) return;
    setIsFetchingGoogle(true);
    setGoogleStatus(null);
    setPendingGoogleData(null);
    try {
      const fetchFn = httpsCallable(functions, 'fetchGoogleBusiness');
      const res: any = await fetchFn({ query: formData.googlePlaceUrl });
      setPendingGoogleData(res.data);
      setGoogleStatus({ type: 'success', msg: 'Localizamos a empresa!' });
    } catch (e: any) {
      setGoogleStatus({ type: 'error', msg: e.message });
    } finally {
      setIsFetchingGoogle(false);
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
    if (d.editorialSummary) {
      updates.editorialSummary = d.editorialSummary;
      updates.description = d.editorialSummary;
    }

    setFormData(prev => {
      const nextState = { ...prev, ...updates };
      if (!nextState.isCustomSlugEdited && updates.businessName) {
        nextState.customSlug = slugify(updates.businessName).slice(0, 30);
        checkDomainDebounced(nextState.customSlug);
      }
      return nextState;
    });
    setHasUnsavedChanges(true);
    setGoogleStatus({ type: 'success', msg: 'Google Inteligência ativada!' });
    setPendingGoogleData(null);
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
  }, [formData.layoutStyle, formData.headerLayout, formData.colorId, formData.logoBase64, formData.logoSize, formData.whatsapp, formData.instagram, formData.facebook, formData.linkedin, formData.tiktok, formData.ifood, formData.noveNove, formData.keeta, formData.showForm, formData.showFloatingContact, formData.showMap, formData.address, formData.phone, formData.email, formData.region]);

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
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <meta name="description" content="${data.description || 'Confira nosso site profissional.'}">
      <meta property="og:title" content="${data.businessName || 'Meu Site Profissional'}">
      <meta property="og:description" content="${data.description || 'Confira nosso site profissional.'}">
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
    if (data.logoBase64) {
      headInjection += `<link rel="icon" type="image/png" href="${data.logoBase64}">`;
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

    if (data.whatsapp) addSocialBtn(`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`, '#25D366', 'WhatsApp', '<i class="fab fa-whatsapp"></i>');
    if (data.instagram) addSocialBtn(`https://instagram.com/${data.instagram.replace('@', '')}`, '#E1306C', 'Instagram', '<i class="fab fa-instagram"></i>');
    if (data.facebook) addSocialBtn(data.facebook.startsWith('http') ? data.facebook : `https://${data.facebook}`, '#1877F2', 'Facebook', '<i class="fab fa-facebook-f"></i>');
    if (data.linkedin) addSocialBtn(data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`, '#0A66C2', 'LinkedIn', '<i class="fab fa-linkedin-in"></i>');
    if (data.tiktok) addSocialBtn(data.tiktok.startsWith('http') ? data.tiktok : `https://${data.tiktok}`, '#000000', 'TikTok', '<i class="fab fa-tiktok"></i>');
    if (data.ifood) addSocialBtn(data.ifood.startsWith('http') ? data.ifood : `https://${data.ifood}`, '#EA1D2C', 'iFood', '<img src="https://cdn.simpleicons.org/ifood/EA1D2C" alt="iFood" style="width: 20px; height: 20px; object-fit: contain;"/>');
    if (data.noveNove) addSocialBtn(data.noveNove.startsWith('http') ? data.noveNove : `https://${data.noveNove}`, '#FFC700', '99', '<span style="font-size: 15px; font-weight: 900; line-height: 1;">99</span>');
    if (data.keeta) addSocialBtn(data.keeta.startsWith('http') ? data.keeta : `https://${data.keeta}`, '#19B84A', 'Keeta', '<span style="font-size: 15px; font-weight: 900; line-height: 1;">Keeta</span>');

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
      if (e.data?.type === 'TRIGGER_FETCH_GOOGLE') {
        setFormData(p => ({ ...p, googlePlaceUrl: e.data.value }));
        setTimeout(() => fetchGoogleData(), 100);
      }
      if (e.data?.type === 'ACTION_CONFIRM_GOOGLE') {
        confirmGoogleInjection();
      }
      if (e.data?.type === 'ACTION_RESET_GOOGLE') {
        setPendingGoogleData(null);
        setGoogleStatus(null);
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
      if (errMsg.includes('violar nossas políticas')) {
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
            setFormData({ businessName: '', description: '', region: '', whatsapp: '', instagram: '', facebook: '', linkedin: '', tiktok: '', ifood: '', noveNove: '', keeta: '', phone: '', email: '', address: '', showMap: true, showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa', logoBase64: '', logoSize: 40, segment: '', googlePlaceUrl: '', showReviews: false, reviews: [], editorialSummary: '', customSlug: '', isCustomSlugEdited: false, googlePhotos: [], headerLayout: 'logo_left_icons_right', manualCss: '' });
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

  const renderMobileWizard = () => {
    if (!isMobile || !generatedHtml) return null;
    
    const steps = [
      { id: 1, title: '🏷️ Identidade', icon: <Briefcase size={16} /> },
      { id: 2, title: '🧱 Modelo', icon: <Settings size={16} /> },
      { id: 3, title: '🌈 Cores', icon: <Palette size={16} /> },
      { id: 4, title: '📝 Conteúdo', icon: <FileText size={16} /> },
      { id: 5, title: '📱 Contatos', icon: <Phone size={16} /> },
      { id: 6, title: '🌐 Redes Sociais', icon: <Globe size={16} /> },
      { id: 7, title: '🖼️ Logotipo', icon: <Upload size={16} /> },
      { id: 8, title: '📍 Extras', icon: <MapPin size={16} /> },
    ];

    const currentStepData = steps.find(s => s.id === mobileWizardStep);

    return (
      <AnimatePresence>
        {isMobileWizardOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-stone-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header com Abas */}
            <div className="bg-stone-50/80 backdrop-blur-md border-b border-stone-100 flex-shrink-0">
               <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex bg-stone-200/50 p-1 rounded-xl w-full max-w-[240px]">
                    <button 
                      onClick={() => setMobileActiveTab('editar')}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${mobileActiveTab === 'editar' ? 'bg-white text-teal-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                      Editar Site
                    </button>
                    <button 
                      onClick={() => setMobileActiveTab('plano')}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${mobileActiveTab === 'plano' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                      Meu Plano
                    </button>
                  </div>
                  <button onClick={() => setIsMobileWizardOpen(false)} className="bg-stone-200/50 p-2 ml-4 rounded-full text-stone-500">
                    <X size={18} />
                  </button>
               </div>
            </div>

            {mobileActiveTab === 'editar' ? (
              <>
                {/* Header do Wizard */}
                <div className="px-6 py-4 border-b border-stone-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-0.5">Passo {mobileWizardStep} de {steps.length}</span>
                    <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                       {currentStepData?.title}
                    </h3>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="h-1 w-full bg-stone-100 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(mobileWizardStep / steps.length) * 100}%` }}
                    className="absolute top-0 left-0 h-full bg-teal-500"
                  />
                </div>

                {/* Área de Scroll do Formulário */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 pb-24">
                  {mobileWizardStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Nome do Seu Negócio</label>
                        <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm font-bold text-stone-800 focus:border-teal-500 outline-none" placeholder="Ex: Pizzaria do Zé" value={formData.businessName} onChange={e => handleFloatNameChange(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Seu Endereço Web Temporário</label>
                        <div className="flex bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:border-teal-500 transition-all">
                          <input className="flex-1 bg-transparent px-3 py-4 text-sm font-mono font-bold text-teal-600 outline-none w-full text-right" placeholder="meu-site" value={formData.customSlug} onChange={e => handleCustomSlugChange(e.target.value)} />
                          <span className="bg-stone-100 border-l border-stone-200 px-3 py-4 text-[10px] font-bold text-stone-400 flex items-center select-none shadow-inner">.sitezing.com.br</span>
                        </div>
                        {floatDomainStatus.available === false && <p className="text-[9px] text-red-500 font-bold mt-1">✗ Este link já está em uso.</p>}
                      </div>
                    </div>
                  )}

                  {mobileWizardStep === 2 && (
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Escolha o Modelo Visual</label>
                      <div className="relative group">
                        <select 
                          value={formData.layoutStyle}
                          onChange={(e) => { setFormData({ ...formData, layoutStyle: e.target.value }); setHasUnsavedChanges(true); }}
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 pr-12 text-sm font-bold text-stone-800 appearance-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all cursor-pointer shadow-sm"
                        >
                          {LAYOUT_STYLES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 group-focus-within:text-teal-500 transition-colors">
                          <Settings size={18} className="animate-spin-slow" />
                        </div>
                      </div>
                      <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-xl flex items-start gap-3">
                        <Info size={16} className="text-teal-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-teal-900 leading-tight">Dica de Design</p>
                          <p className="text-[10px] text-teal-700 mt-1 leading-relaxed">{LAYOUT_STYLES.find(s => s.id === formData.layoutStyle)?.desc || 'Cada modelo altera radicalmente a forma como seu conteúdo é apresentado.'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {mobileWizardStep === 3 && (
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Paleta de Cores do Site</label>
                      <div className="grid grid-cols-5 gap-3">
                        {COLORS.slice(0, 15).map(c => (
                          <button key={c.id} onClick={() => { setFormData({ ...formData, colorId: c.id }); setHasUnsavedChanges(true); }} className={`w-full aspect-square rounded-2xl border-2 transition-all flex items-center justify-center ${formData.colorId === c.id ? 'border-teal-500 scale-110 shadow-lg shadow-teal-500/20' : 'border-transparent bg-stone-50'}`} style={{ backgroundColor: c.c1 }}>
                             {formData.colorId === c.id && <Check size={16} className="text-white drop-shadow-md" />}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-stone-400 text-center font-medium italic">Selecione a cor que melhor combina com sua marca.</p>
                    </div>
                  )}

                  {mobileWizardStep === 4 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">O Que Vocês Fazem? (Foco em Vendas)</label>
                        <textarea className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-800 h-40 outline-none focus:border-teal-500 resize-none font-medium leading-relaxed" placeholder="Ex: Somos uma pizzaria artesanal focada em ingredientes frescos e entrega rápida..." value={formData.description} onChange={e => { setFormData({ ...formData, description: e.target.value }); setHasUnsavedChanges(true) }} />
                      </div>
                    </div>
                  )}

                  {mobileWizardStep === 5 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">WhatsApp Para Pedidos</label>
                        <div className="relative">
                          <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 pl-12 text-sm font-bold text-stone-800 outline-none focus:border-teal-500" placeholder="DDD + Número" value={formData.whatsapp} onChange={e => { setFormData({ ...formData, whatsapp: e.target.value }); setHasUnsavedChanges(true) }} />
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Telefone de Contato (Opcional)</label>
                        <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-teal-500" placeholder="Fixo ou Celular" value={formData.phone} onChange={e => { setFormData({ ...formData, phone: e.target.value }); setHasUnsavedChanges(true) }} />
                      </div>
                    </div>
                  )}

                  {mobileWizardStep === 6 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Instagram do Negócio</label>
                        <div className="relative">
                          <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 pl-12 text-sm font-bold text-stone-800 outline-none focus:border-pink-500" placeholder="@usuario" value={formData.instagram} onChange={e => { setFormData({ ...formData, instagram: e.target.value }); setHasUnsavedChanges(true) }} />
                          <Instagram size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500" />
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-400 leading-relaxed">Conectar suas redes sociais aumenta a confiança dos seus clientes.</p>
                    </div>
                  )}

                  {mobileWizardStep === 7 && (
                    <div className="space-y-6 text-center">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block text-left">Sua Logomarca</label>
                        {!formData.logoBase64 ? (
                          <label className="cursor-pointer w-full border-2 border-dashed border-stone-200 hover:border-teal-400 rounded-2xl p-12 flex flex-col items-center gap-3 text-stone-500 transition-colors bg-stone-50">
                            <div className="bg-white p-4 rounded-2xl shadow-sm"><Upload size={24} className="text-teal-500" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Enviar Logotipo</span>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                        ) : (
                          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 relative">
                             <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center">
                               <img src={formData.logoBase64} style={{ maxHeight: `${formData.logoSize || 40}px` }} className="block object-contain" />
                             </div>
                             <button onClick={() => { setFormData(p => ({ ...p, logoBase64: '', logoSize: 40 })); setHasUnsavedChanges(true); }} className="text-red-500 text-[10px] font-black uppercase mb-6 block w-full hover:underline">Remover Logotipo</button>
                             <div className="space-y-3 text-left bg-white p-4 rounded-xl border border-stone-100">
                               <label className="flex justify-between text-[9px] font-black text-stone-400 uppercase tracking-tighter">Ajustar Tamanho no Site <span>{formData.logoSize}px</span></label>
                               <input type="range" min="20" max="100" value={formData.logoSize} onChange={e => { setFormData({ ...formData, logoSize: parseInt(e.target.value) }); setHasUnsavedChanges(true) }} className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                             </div>
                          </div>
                        )}
                    </div>
                  )}

                  {mobileWizardStep === 8 && (
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Endereço Físico (Opcional)</label>
                        <input className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-teal-500" placeholder="Rua, Número, Bairro - Cidade" value={formData.address} onChange={e => { setFormData({ ...formData, address: e.target.value }); setHasUnsavedChanges(true) }} />
                      </div>
                      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-stone-800 uppercase">Exibir Mapa</span>
                            <span className="text-[9px] text-stone-400">Mostra sua localização no site</span>
                         </div>
                         <div onClick={() => { setFormData({ ...formData, showMap: !formData.showMap }); setHasUnsavedChanges(true); }} className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${formData.showMap ? 'bg-teal-500' : 'bg-stone-300'}`}>
                            <motion.div animate={{ x: formData.showMap ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                         </div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center">
                        <Rocket size={24} className="text-emerald-500 mx-auto mb-3" />
                        <h4 className="text-xs font-black text-emerald-800 uppercase italic">Tudo Pronto!</h4>
                        <p className="text-[10px] text-emerald-600 mt-1 font-medium">Suas alterações foram preparadas com sucesso.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer de Navegação */}
                <div className="p-6 border-t border-stone-100 bg-white/80 backdrop-blur-md absolute bottom-0 left-0 right-0 z-20 flex gap-3">
                  {mobileWizardStep > 1 && (
                    <button 
                      onClick={() => setMobileWizardStep(prev => prev - 1)}
                      className="flex-1 bg-stone-100 ring-1 ring-stone-200 text-stone-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    >
                      Voltar
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (mobileWizardStep < steps.length) {
                        setMobileWizardStep(prev => prev + 1);
                      } else {
                        handleSaveOrUpdateSite();
                      }
                    }}
                    className={`flex-[2] bg-stone-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-stone-900/20 active:scale-95 transition-all`}
                  >
                    {mobileWizardStep < steps.length ? <>Próximo <ChevronRight size={14} /></> : <>Publicar Mudanças 🚀</>}
                  </button>
                </div>
              </>
            ) : (
              /* ABA DO PLANO */
              <div className="p-6 overflow-y-auto flex-1 space-y-6 pb-24">
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2rem] text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-orange-100">
                    <Globe size={32} className="text-orange-500 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black text-orange-900 uppercase">Seu Domínio Profissional</h3>
                  <p className="text-stone-500 text-xs mt-2 leading-relaxed">Coloque seu negócio no ar com um endereço exclusivo como <strong>seunegocio.com.br</strong></p>
                </div>

                {currentProjectSlug ? (
                  <div className="space-y-4">
                     <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Status da Publicação</span>
                           <span className="text-xs font-bold text-stone-800">{officialDomain && officialDomain !== 'Pendente' ? officialDomain : 'Domínio Próprio Indisponível'}</span>
                        </div>
                        {getStatusBadge(savedProjects.find(p => p.id === currentProjectSlug))}
                     </div>

                     <div className="bg-teal-50 border border-teal-100 p-6 rounded-2xl">
                        <h4 className="text-sm font-black text-teal-900 uppercase mb-3">Ativar Plano Premium</h4>
                        <div className="space-y-3 mb-6">
                           <div className="flex items-center gap-2 text-xs text-teal-700 font-bold"><Check size={14} /> Site no ar 24h por dia</div>
                           <div className="flex items-center gap-2 text-xs text-teal-700 font-bold"><Check size={14} /> E-mail profissional grátis</div>
                           <div className="flex items-center gap-2 text-xs text-teal-700 font-bold"><Check size={14} /> Suporte Prioritário VIP</div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('assinatura')} 
                          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black uppercase text-[11px] tracking-widest py-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                        >
                          Conhecer Planos
                        </button>
                     </div>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-dashed border-stone-300 p-8 rounded-[2rem] text-center">
                    <Rocket size={32} className="text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500 text-xs font-medium">Salve seu projeto primeiro para ver as opções de publicação e planos.</p>
                    <button onClick={() => setMobileActiveTab('editar')} className="mt-4 text-teal-600 text-xs font-black uppercase hover:underline">Voltar para Edição</button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* O Float Button foi movido para o bloco principal de return para persistência */}
      </AnimatePresence>
    );
  };

  const getStatusBadge = (project: any) => {
    if (!project) return null;
    if (project.status === 'frozen') return <span className="text-[9px] bg-red-500/20 text-red-600 px-2 py-0.5 rounded-full font-bold ml-2 border border-red-500/30">CONGELADO</span>;

    if (project.expiresAt) {
      const expirationDate = project.expiresAt._seconds ? project.expiresAt._seconds * 1000 : project.expiresAt.seconds * 1000;
      const daysLeft = Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

      if (daysLeft <= 0) return <span className="text-[9px] bg-red-500/20 text-red-600 px-2 py-0.5 rounded-full font-bold ml-2 border border-red-500/30">VENCIDO</span>;

      if (project.paymentStatus === 'paid') {
        return <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold ml-2 border border-emerald-200" title="Plano Ativo">ATIVO ({daysLeft} dias restantes)</span>;
      } else {
        return <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold ml-2 border border-orange-200 animate-pulse" title="Período de Teste">TRIAL ({daysLeft} dias restantes)</span>;
      }
    }
    return <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold ml-2">RASCUNHO</span>;
  };

  return (
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

      <div className="w-full h-screen bg-[#FAFAF9] overflow-hidden font-sans text-stone-900 flex flex-col md:flex-row">

        <div className="flex-1 relative h-full overflow-hidden bg-[#FAFAF9]">
          <iframe
            ref={iframeRef}
            srcDoc={generatedHtml ? getPreviewHtml(generatedHtml) : getDynamicPromoHtml(platformConfigs)}
            className="w-full h-full border-none bg-transparent"
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

          {renderMobileWizard()}

          {/* Botão Flutuante Permanente para Mobile (Sempre visível se fechado) */}
          <AnimatePresence>
            {isMobile && !isMobileWizardOpen && generatedHtml && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setIsMobileWizardOpen(true)}
                className="fixed bottom-6 left-6 z-[100] w-14 h-14 bg-stone-900 text-white rounded-full shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-all border-4 border-white group"
              >
                <Menu size={22} className="group-active:rotate-90 transition-transform" />
                <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">Menu</span>
              </motion.button>
            )}
          </AnimatePresence>
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
                      <button className="text-stone-400 hover:text-teal-500 transition-colors" title={`Logado como: ${loggedUserEmail}`}><User size={18} /></button>
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

                {generatedHtml && (() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  let daysLeft = 0; let isPaid = false;
                  if (currentProject?.expiresAt) {
                    const expirationDate = currentProject.expiresAt._seconds ? currentProject.expiresAt._seconds * 1000 : currentProject.expiresAt.seconds * 1000;
                    daysLeft = Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    isPaid = currentProject.paymentStatus === 'paid';
                  }
                  return (
                    <div className="flex border-b border-stone-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex-shrink-0 bg-white">
                      <button onClick={() => setActiveTab('geral')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors ${activeTab === 'geral' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}`}>
                        Visual
                      </button>
                      <button onClick={() => setActiveTab('dominio')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors relative ${activeTab === 'dominio' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}`}>
                        Domínio
                        {(!officialDomain || officialDomain === 'Pendente' || registerLater) && (
                          <span className="absolute top-3 right-4 flex h-2 w-2" title="Domínio não configurado"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                        )}
                      </button>
                      {currentProjectSlug && (
                        <button onClick={() => setActiveTab('assinatura')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors relative ${activeTab === 'assinatura' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'} ${guideStep === 4 ? 'animate-guide-pulse' : ''}`}>
                          Pagamento
                          <GuidedTip step={4} currentStep={guideStep} text="Tudo pronto! Ative seu plano para manter seu site online." position="bottom" />
                          {!isPaid && (
                            <span className="absolute top-3 right-2 flex h-2 w-2"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${daysLeft > 0 ? 'bg-yellow-400' : 'bg-red-400'}`}></span><span className={`relative inline-flex rounded-full h-2 w-2 ${daysLeft > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></span></span>
                          )}
                        </button>
                      )}
                      {loggedUserEmail === 'caiotleal@gmail.com' && (
                        <button onClick={() => setActiveTab('plataforma')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors ${activeTab === 'plataforma' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}`}>
                          Plataforma
                        </button>
                      )}
                    </div>
                  );
                })()}

                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 pb-6 bg-white">
                  {activeTab === 'geral' && (
                    <>
                      {currentProjectSlug && (
                        <div className="group relative flex items-center justify-between bg-stone-50 p-3.5 rounded-xl border border-stone-200 -mt-2">
                          <div className="flex items-center gap-2 cursor-help">
                            <Info size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-600 font-bold uppercase tracking-wider">Status do Site</span>
                          </div>
                          {getStatusBadge(savedProjects.find(p => p.id === currentProjectSlug) || {})}
                        </div>
                      )}

                      <div className="space-y-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl relative overflow-hidden group">
                          <label className="block text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Importação Mágica (Google)
                          </label>
                          <div className="flex flex-col gap-2 relative z-10 w-full shrink-0">
                            <input
                              type="text"
                              placeholder="Link do Maps ou Nome do Local..."
                              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2.5 text-[11px] font-medium focus:outline-none focus:border-emerald-500 transition-all placeholder:text-stone-400 text-stone-800 min-w-0"
                              value={formData.googlePlaceUrl || ''}
                              onChange={(e) => { setFormData({ ...formData, googlePlaceUrl: e.target.value }); setHasUnsavedChanges(true) }}
                            />
                            <button
                              type="button"
                              onClick={fetchGoogleData}
                              disabled={isFetchingGoogle || !formData.googlePlaceUrl}
                              className="w-full shrink-0 bg-emerald-600 hover:bg-emerald-500 border border-emerald-700 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                              {isFetchingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Puxar Dados'}
                            </button>
                          </div>
                          {pendingGoogleData && (
                            <div className="mt-3 bg-white border border-emerald-200 p-3.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(16,185,129,0.3)] text-center relative z-20 overflow-hidden before:absolute before:inset-0 before:bg-emerald-500/5">
                              <p className="text-[11px] font-black justify-center text-emerald-800 uppercase flex items-center gap-1.5 mb-1.5"><CheckCircle size={14} /> É esta a empresa?</p>
                              <p className="text-[10px] text-stone-600 mb-3 font-medium px-2 leading-relaxed h-10 line-clamp-2"><span className="font-bold">{pendingGoogleData.name}</span> - {pendingGoogleData.address}</p>
                              <div className="flex gap-2 relative z-10">
                                <button type="button" onClick={() => setPendingGoogleData(null)} className="flex-1 py-2.5 bg-stone-100 text-stone-500 rounded-lg text-[9px] uppercase font-black tracking-wider hover:bg-stone-200 transition-colors">Voltar</button>
                                <button type="button" onClick={confirmGoogleInjection} className="flex-[2] py-2.5 px-3 bg-emerald-600 text-white rounded-lg text-[10px] uppercase font-black tracking-widest hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center gap-1.5"><Rocket size={12} /> Confirmar</button>
                              </div>
                            </div>
                          )}
                          {!pendingGoogleData && googleStatus && (
                            <div className={`mt-3 text-[10px] uppercase font-black tracking-widest text-center ${googleStatus.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                              {googleStatus.msg}
                            </div>
                          )}
                        </motion.div>

                        <div className="relative">
                          <label className="text-[11px] font-black text-stone-500 uppercase flex items-center gap-1.5 mb-1.5"><Briefcase size={12} /> Nome do Negócio</label>
                          <input className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-[12px] font-bold text-stone-800 focus:border-teal-500 outline-none transition-colors mb-3" placeholder="Ex: Eletricista Silva" value={formData.businessName} onChange={e => handleFloatNameChange(e.target.value)} />

                          <label className="text-[11px] font-black text-stone-500 uppercase flex items-center gap-1.5 mb-1.5"><Globe size={12} /> Seu Link Oficial</label>
                          <div className="flex bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <input className="flex-1 bg-transparent px-3 py-2.5 text-[12px] font-mono font-bold text-blue-600 outline-none w-full text-right" placeholder="meu-site" value={formData.customSlug} onChange={e => handleCustomSlugChange(e.target.value)} />
                            <span className="bg-stone-100 border-l border-stone-200 px-3 py-2.5 text-[11px] font-bold text-stone-400 flex items-center select-none shadow-inner">.sitezing.com.br</span>
                          </div>

                          <div className="mt-1.5 min-h-[16px]">
                            {floatDomainStatus.loading && (
                              <div className="text-[10px] text-stone-400 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Validando domínio...</div>
                            )}
                            {!floatDomainStatus.loading && formData.customSlug.length >= 3 && floatDomainStatus.available === false && (
                              <div className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10} /> "{floatDomainStatus.slug}" já está em uso! Tente modificar.</div>
                            )}
                            {!floatDomainStatus.loading && formData.customSlug.length >= 3 && floatDomainStatus.available && floatDomainStatus.slug && (
                              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> Liberado!</div>
                            )}
                          </div>
                        </div>
                        <div><label className="text-[11px] font-black text-stone-500 uppercase flex items-center gap-1.5 mb-1.5"><FileText size={12} /> Ideia Principal</label><textarea className="w-full h-20 bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-[12px] resize-none focus:border-teal-500 outline-none transition-colors text-stone-800" placeholder="Descreva os serviços..." value={formData.description} onChange={e => { setFormData({ ...formData, description: e.target.value }); setHasUnsavedChanges(true) }} /></div>
                      </div>

                      <button onClick={() => handleGenerate()} disabled={isGenerating} className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-stone-700 transition-colors shadow-md">
                        {isGenerating ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />} {generatedHtml ? 'Recriar Site c/ IA' : 'Gerar Meu Site'}
                      </button>

                      {generatedHtml && (
                        <div className="pt-6 border-t border-stone-100 space-y-6">
                          <div className="space-y-4">
                            <div className="space-y-2.5">
                              <label className="text-xs font-bold text-stone-500 uppercase">Estilo do Site</label>
                              <select className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm outline-none" value={formData.layoutStyle} onChange={e => { setFormData({ ...formData, layoutStyle: e.target.value }); setHasUnsavedChanges(true) }}>{LAYOUT_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
                            </div>

                            <div className="space-y-2.5">
                              <label className="text-xs font-bold text-stone-500 uppercase">Layout do Cabeçalho</label>
                              <select className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm outline-none font-medium" value={formData.headerLayout} onChange={e => { setFormData({ ...formData, headerLayout: e.target.value }); setHasUnsavedChanges(true) }}>
                                <option value="logo_left_icons_right">Logo Esquerda / Ícones Direita</option>
                                <option value="logo_right_icons_left">Logo Direita / Ícones Esquerda</option>
                                <option value="logo_center_icons_right">Logo Centro / Ícones Direita</option>
                                <option value="logo_center_icons_left">Logo Centro / Ícones Esquerda</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-bold text-stone-500 uppercase block border-b border-stone-100 pb-2">Temas (Cores)</label>

                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">1. Essenciais da Marca</span>
                              <div className="grid grid-cols-5 gap-3">
                                {COLORS.filter(c => !c.id.includes('_')).map(c => (
                                  <button key={c.id} onClick={() => { setFormData({ ...formData, colorId: c.id }); setHasUnsavedChanges(true); }} className={`w-10 h-10 rounded-full transition-all relative overflow-hidden shadow-sm ${formData.colorId === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'} ring-offset-white`} title={c.name}><div className="absolute inset-0" style={{ backgroundColor: c.c1 }} /><div className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-full" style={{ backgroundColor: c.c4 }} /></button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">2. Paleta Celeste</span>
                              <div className="grid grid-cols-5 gap-3">
                                {COLORS.filter(c => c.id.startsWith('celeste_')).map(c => (
                                  <button key={c.id} onClick={() => { setFormData({ ...formData, colorId: c.id }); setHasUnsavedChanges(true); }} className={`w-10 h-10 rounded-full transition-all relative overflow-hidden shadow-sm ${formData.colorId === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'} ring-offset-white`} title={c.name}><div className="absolute inset-0" style={{ backgroundColor: c.c1 }} /><div className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-full" style={{ backgroundColor: c.c4 }} /></button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">3. Paleta Marinha</span>
                              <div className="grid grid-cols-5 gap-3">
                                {COLORS.filter(c => c.id.startsWith('marinha_')).map(c => (
                                  <button key={c.id} onClick={() => { setFormData({ ...formData, colorId: c.id }); setHasUnsavedChanges(true); }} className={`w-10 h-10 rounded-full transition-all relative overflow-hidden shadow-sm ${formData.colorId === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'} ring-offset-white`} title={c.name}><div className="absolute inset-0" style={{ backgroundColor: c.c1 }} /><div className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-full" style={{ backgroundColor: c.c4 }} /></button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">4. Mediterrânea</span>
                              <div className="grid grid-cols-5 gap-3">
                                {COLORS.filter(c => c.id.startsWith('med_')).map(c => (
                                  <button key={c.id} onClick={() => { setFormData({ ...formData, colorId: c.id }); setHasUnsavedChanges(true); }} className={`w-10 h-10 rounded-full transition-all relative overflow-hidden shadow-sm ${formData.colorId === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'} ring-offset-white`} title={c.name}><div className="absolute inset-0" style={{ backgroundColor: c.c1 }} /><div className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-full" style={{ backgroundColor: c.c4 }} /></button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">5. Caribe</span>
                              <div className="grid grid-cols-5 gap-3">
                                {COLORS.filter(c => c.id.startsWith('caribe_')).map(c => (
                                  <button key={c.id} onClick={() => { setFormData({ ...formData, colorId: c.id }); setHasUnsavedChanges(true); }} className={`w-10 h-10 rounded-full transition-all relative overflow-hidden shadow-sm ${formData.colorId === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'} ring-offset-white`} title={c.name}><div className="absolute inset-0" style={{ backgroundColor: c.c1 }} /><div className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-full" style={{ backgroundColor: c.c4 }} /></button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <label className="text-xs font-bold text-stone-500 uppercase flex justify-between items-center"><span>Sua Logomarca</span>{formData.logoBase64 && <button onClick={() => { setFormData(p => ({ ...p, logoBase64: '', logoSize: 40 })); setHasUnsavedChanges(true); }} className="text-red-500 hover:text-red-600 text-[10px] font-bold">X Remover</button>}</label>
                            {!formData.logoBase64 ? (
                              <div className="space-y-2"><label className="cursor-pointer w-full border border-dashed border-stone-300 hover:border-teal-400 rounded-xl p-4 flex justify-center items-center gap-2 text-xs text-stone-500 transition-colors bg-stone-50"><Upload size={14} /> Fazer Upload da Marca<input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></label></div>
                            ) : (
                              <div className="space-y-3 bg-stone-50 border border-stone-200 rounded-xl p-4">
                                <div className="h-16 flex items-center justify-center overflow-hidden bg-white rounded-lg border border-stone-200 relative">
                                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px' }}></div>
                                  <img src={formData.logoBase64} style={{ maxHeight: `${formData.logoSize || 40}px` }} className="w-auto object-contain relative z-10 transition-all" alt="Logo" />
                                </div>
                                <div className="space-y-1 mt-2">
                                  <label className="flex justify-between text-[10px] font-bold text-stone-500 uppercase"><span>Tamanho da Logo</span><span>{formData.logoSize || 40}px</span></label>
                                  <input type="range" min="20" max="100" value={formData.logoSize || 40} onChange={e => { setFormData({ ...formData, logoSize: parseInt(e.target.value) }); setHasUnsavedChanges(true) }} className="w-full accent-teal-500" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3 pt-5 border-t border-stone-100">
                            <label className="text-xs font-bold text-stone-500 uppercase flex gap-1.5"><Globe size={14} /> Redes Sociais & Delivery</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="WhatsApp (só números)" value={formData.whatsapp} onChange={e => { setFormData({ ...formData, whatsapp: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Instagram (@usuario)" value={formData.instagram} onChange={e => { setFormData({ ...formData, instagram: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Facebook (Link)" value={formData.facebook} onChange={e => { setFormData({ ...formData, facebook: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="LinkedIn (Link)" value={formData.linkedin} onChange={e => { setFormData({ ...formData, linkedin: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="TikTok (Link ou @)" value={formData.tiktok} onChange={e => { setFormData({ ...formData, tiktok: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="iFood (Link)" value={formData.ifood} onChange={e => { setFormData({ ...formData, ifood: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="99 Food (Link)" value={formData.noveNove} onChange={e => { setFormData({ ...formData, noveNove: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Keeta (Link)" value={formData.keeta} onChange={e => { setFormData({ ...formData, keeta: e.target.value }); setHasUnsavedChanges(true) }} />
                            </div>
                          </div>

                          <div className="space-y-3 pt-5 border-t border-stone-100">
                            <label className="text-xs font-bold text-stone-500 uppercase flex gap-1.5"><MapPin size={14} /> Contato e Localização</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Telefone" value={formData.phone} onChange={e => { setFormData({ ...formData, phone: e.target.value }); setHasUnsavedChanges(true) }} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="E-mail" value={formData.email} onChange={e => { setFormData({ ...formData, email: e.target.value }); setHasUnsavedChanges(true) }} />
                            </div>
                            <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Endereço Físico" value={formData.address} onChange={e => { setFormData({ ...formData, address: e.target.value }); setHasUnsavedChanges(true) }} />

                            <label className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600"><span>Exibir Mapa do Google</span><input type="checkbox" checked={formData.showMap} onChange={e => { setFormData({ ...formData, showMap: e.target.checked }); setHasUnsavedChanges(true) }} className="accent-teal-500" /></label>
                            <label className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600"><span>Exibir formulário de contato</span><input type="checkbox" checked={formData.showForm} onChange={e => { setFormData({ ...formData, showForm: e.target.checked }); setHasUnsavedChanges(true) }} className="accent-teal-500" /></label>
                            {formData.reviews && formData.reviews.length > 0 && (
                              <label className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-stone-600 font-bold mt-2">
                                <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-emerald-500" /> Exibir Galeria de Avaliações Google</span>
                                <input type="checkbox" checked={formData.showReviews} onChange={e => { setFormData({ ...formData, showReviews: e.target.checked }); setHasUnsavedChanges(true) }} className="accent-emerald-500" />
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </>
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

                    const expirationDate = currentProject?.expiresAt ? (currentProject.expiresAt._seconds ? currentProject.expiresAt._seconds * 1000 : currentProject.expiresAt.seconds * 1000) : null;
                    const daysLeft = expirationDate ? Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

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
                                  {isPaid ? (isCanceled ? 'Cancelada' : 'Assinatura Ativa') : 'Teste Gratuito (Trial)'}
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
                                  onClick={() => { setSelectedPlanModal(currentProject.planSelected === 'anual' ? 'monthly' : 'annual'); setCheckoutTermsAccepted(false); }}
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

                  {loggedUserEmail && (
                    <div className="mt-8 border-t border-stone-200 pt-6 space-y-4">
                      <div className="flex items-center justify-between"><p className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2"><LayoutDashboard size={14} className="text-emerald-600" />Meus Projetos</p><button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase bg-red-50 px-2.5 py-1 rounded-lg">Sair</button></div>
                      <div className="max-h-52 overflow-y-auto space-y-2">
                        {savedProjects.length === 0 ? <p className="text-xs text-stone-400 italic text-center py-4">Nenhum projeto ainda.</p> : (
                          savedProjects.map((p: any) => (
                            <div key={p.id} className="flex gap-1 sm:gap-1.5 bg-white border border-stone-200 rounded-xl p-2 sm:p-2.5 shadow-sm max-w-full overflow-hidden">
                              <button onClick={() => handleLoadProject(p)} className={`flex-1 text-left bg-stone-50 hover:bg-stone-100 rounded-lg p-2 sm:p-3 flex items-center transition-all min-w-0 ${currentProjectSlug === p.id ? 'ring-1 ring-teal-400' : ''}`}><div className="flex flex-col min-w-0 w-full pr-1.5"><div className="flex items-center gap-1.5 w-full"><span className="font-bold text-[10px] sm:text-xs text-stone-800 truncate leading-tight">{p.businessName || 'Sem Nome'}</span>{getStatusBadge(p)}</div><span className="text-[8px] sm:text-[9px] text-stone-400 font-mono mt-0.5 truncate w-full block">{p.publishUrl?.replace('https://', '') || 'Sem link público'}</span></div></button>
                              <button onClick={() => handleDeleteSite(p.id)} className="w-8 sm:w-10 flex-shrink-0 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-lg flex items-center justify-center transition-all min-h-full"><Trash2 size={14} /></button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {generatedHtml && (() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  const isPublished = Boolean(currentProject?.publishUrl || currentProject?.status === 'active' || currentProject?.status === 'published');

                  let isExpired = false;
                  if (currentProject?.expiresAt) {
                    const expDate = currentProject.expiresAt._seconds ? currentProject.expiresAt._seconds * 1000 : currentProject.expiresAt.seconds * 1000;
                    if (expDate < Date.now() && currentProject.paymentStatus !== 'paid') {
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
                  {platformConfigs?.plans?.length > 0 ? (
                    [...platformConfigs.plans].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((p: any) => {
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
                              setIsPlansBannerOpen(false);
                              setTimeout(() => { window.location.hash = '#criarsite'; }, 50);
                            }}
                            className={`w-full py-4 rounded-xl cursor-pointer font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 text-xs ${isAnual ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30' : 'bg-stone-900 text-white hover:bg-black shadow-lg shadow-black/20'}`}
                          >
                            <Rocket size={16} /> Criar meu site
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-3 text-center py-10 text-stone-500 font-bold">Nenhum plano configurado.</div>
                  )}
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

      {/* MODAL FLUTUANTE DE CAPTAÇÃO 10S - CENTRALIZADO E SIMPLIFICADO */}
      <AnimatePresence>
        {showFloatModal && !isMenuOpen && !generatedHtml && !currentProjectSlug && (
          <div className="fixed inset-0 z-[500] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="w-full max-w-[380px] bg-white border border-stone-200 shadow-2xl rounded-3xl overflow-hidden relative"
            >
              <div className="bg-gradient-to-r from-teal-600 to-indigo-600 p-5 relative text-center">
                <button onClick={() => setShowFloatModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-black/20 p-1.5 rounded-full">
                  <X size={18} />
                </button>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/20">
                  <Rocket className="w-6 h-6 text-yellow-300" />
                </div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-wider">
                  Crie em 30 Segundos
                </h3>
                <p className="text-white/80 text-xs mt-1.5 font-medium leading-relaxed">Não perca mais nenhuma venda. Deixe nossa IA montar tudo de imediato.</p>
              </div>
              <div className="p-6">
                <div className="space-y-5">
                  <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-2xl relative overflow-hidden ring-1 ring-blue-500/10">
                    <label className="text-[10px] uppercase tracking-widest font-black text-blue-800 mb-3 flex items-center justify-center gap-1.5"><MapPin size={14} className="text-blue-600" /> Importação Mágica do Google</label>
                    <div className="flex flex-col gap-2 relative z-10 w-full">
                      <input
                        type="text" placeholder="Cole de onde achar: Maps, Link ou Nome..."
                        className="w-full bg-white border border-blue-200 rounded-xl text-center px-3 py-3.5 text-[11px] font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-stone-800 shadow-sm transition-all"
                        value={formData.googlePlaceUrl || ''}
                        onChange={(e) => setFormData(p => ({ ...p, googlePlaceUrl: e.target.value }))}
                      />
                      <button
                        onClick={async () => fetchGoogleData()}
                        disabled={isFetchingGoogle || !formData.googlePlaceUrl}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                      >
                        {isFetchingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Trazer Meu Negócio'}
                      </button>
                    </div>

                    {pendingGoogleData && (
                      <div className="mt-4 pt-4 border-t border-blue-200/50">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center text-center">
                          <CheckCircle size={16} className="text-emerald-500 mb-1.5" />
                          <p className="text-[10px] text-stone-800 font-bold mb-0.5">{pendingGoogleData.name}</p>
                          <p className="text-[9px] text-stone-500 font-medium mb-3 h-6 line-clamp-2 leading-tight">{pendingGoogleData.address}</p>
                          <div className="flex gap-2 w-full">
                            <button type="button" onClick={() => setPendingGoogleData(null)} className="flex-1 py-2 bg-stone-100 text-stone-500 rounded-lg text-[9px] uppercase font-black hover:bg-stone-200 transition-colors">Tentar Outro</button>
                            <button type="button" onClick={confirmGoogleInjection} className="flex-[1.5] py-2 bg-emerald-600 text-white rounded-lg text-[9px] uppercase font-black shadow-md hover:bg-emerald-500 transition-all flex justify-center items-center gap-1">Puxar Tudo <Rocket size={10} /></button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!pendingGoogleData && googleStatus && googleStatus.type === 'error' && (
                      <div className="mt-3 text-[9px] text-center font-bold text-red-500">{googleStatus.msg}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 opacity-60 px-4">
                    <div className="flex-1 h-px bg-stone-300"></div><span className="text-[9px] font-black uppercase tracking-widest text-stone-500">OU DIGITE MANUAL</span><div className="flex-1 h-px bg-stone-300"></div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-2 block text-center">Qual o Nome do Seu Negócio?</label>
                    <input
                      type="text" placeholder="Ex: Studio da Beleza"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 text-center text-[12px] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-stone-800 font-bold"
                      value={formData.businessName}
                      onChange={(e) => handleFloatNameChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-2.5 flex items-center justify-center gap-1.5"><Globe size={12} /> Seu Link Oficial</label>
                    <div className="flex bg-white border border-stone-200 rounded-xl overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all shadow-sm">
                      <input className="flex-1 bg-transparent px-3 py-3.5 text-[12px] font-mono font-bold text-teal-600 outline-none w-full text-right placeholder:text-stone-300" placeholder="meu-site" value={formData.customSlug} onChange={e => handleCustomSlugChange(e.target.value)} />
                      <span className="bg-stone-50 border-l border-stone-200 px-3 py-3.5 text-[11px] font-bold text-stone-400 flex items-center select-none shadow-inner">.sitezing.com.br</span>
                    </div>

                    <div className="mt-2 min-h-[16px] text-center">
                      {floatDomainStatus.loading && (
                        <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Mapeando domínio...</div>
                      )}
                      {!floatDomainStatus.loading && formData.customSlug.length >= 3 && floatDomainStatus.available === false && (
                        <div className="text-[10px] text-red-500 font-bold flex items-center justify-center gap-1"><AlertCircle size={10} /> Indisponível. Altere acima!</div>
                      )}
                      {!floatDomainStatus.loading && formData.customSlug.length >= 3 && floatDomainStatus.available && floatDomainStatus.slug && (
                        <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1"><CheckCircle size={10} /> Domínio liberado!</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!formData.businessName || floatDomainStatus.available === false) return;
                      const constructedDesc = `Uma empresa moderna e inovadora chamada ${formData.businessName}.`;
                      setFormData(p => ({ ...p, segment: "Negócios / Geral", description: constructedDesc }));
                      handleGenerate(constructedDesc);
                      setIsMenuOpen(true);
                      setActiveTab('geral');
                    }}
                    disabled={isGenerating || !formData.businessName || floatDomainStatus.available === false}
                    className="w-full bg-[#18181b] hover:bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                  >
                    {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <>✨ Iniciar a Mágica</>}
                  </button>
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
                    const expDate = currentProject.expiresAt._seconds ? currentProject.expiresAt._seconds * 1000 : currentProject.expiresAt.seconds * 1000;
                    if (!isNaN(expDate)) {
                      daysLeft = Math.ceil((new Date(expDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
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

      {/* MODAL DE COLETA DE DADOS (KYC / Profile) */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <ProfileForm 
            initialData={userProfile} 
            onClose={() => setIsProfileModalOpen(false)} 
            onSubmit={handleProfileSubmit} 
          />
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
  );
};

export default App;
