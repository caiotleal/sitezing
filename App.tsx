import React, { Suspense, lazy, useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, functions } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Settings, Upload, Loader2, RefreshCw, Briefcase, FileText, X, Phone, Globe, CheckCircle, Save, Trash2, AlertCircle, LayoutDashboard, MapPin, Copy, ExternalLink, Zap, Star, ShieldCheck, CreditCard, User, LogIn, Info
} from 'lucide-react';
import { TEMPLATES } from './components/templates';
const LoginPage = lazy(() => import('./components/LoginPage'));
const DomainChecker = lazy(() => import('./components/DomainChecker'));
import { useIframeEditor } from './components/useIframeEditor'; 

import { BRAND_LOGO } from './components/brand';

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
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html, body { -ms-overflow-style: none; scrollbar-width: none; background-color: #FAFAF9; color: #1C1917; font-family: sans-serif; overflow-x: hidden; }
    ::-webkit-scrollbar { display: none; }
    .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(231, 229, 228, 0.8); transition: all 0.3s ease; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05); cursor: pointer; }
    .glass-card:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 20px 40px -10px rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.3); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .animate-up { animation: fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    .plan-bg-logo { position: absolute; bottom: -15%; right: -10%; width: 70%; height: auto; opacity: 0.03; pointer-events: none; filter: grayscale(100%); }
  </style>
</head>
<body class="antialiased selection:bg-orange-500 selection:text-white">
  <header class="fixed top-0 left-0 w-full z-[80] bg-[#FAFAF9]/80 backdrop-blur-md border-b border-stone-200/60 h-24 flex items-center px-6 md:px-12 transition-all">
    <div class="max-w-7xl mx-auto w-full flex items-center">
       <img src="${BRAND_LOGO}" alt="SiteZing Logo" class="h-16 md:h-20 w-auto drop-shadow-sm" />
    </div>
  </header>

  <main class="pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col justify-center min-h-screen relative">
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-200/30 blur-[150px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-200/30 blur-[150px] rounded-full pointer-events-none"></div>

    <div class="relative z-10 animate-up text-center md:text-left max-w-3xl mb-16">
      <div class="inline-block px-4 py-1.5 rounded-full bg-white border border-teal-100 text-xs font-bold tracking-widest text-teal-600 mb-6 uppercase shadow-sm">A revolução da web</div>
      <h1 class="text-[3rem] md:text-[5.5rem] font-black leading-[0.9] tracking-tighter mb-6 uppercase italic text-stone-900">
        Seu site pronto em um <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 pr-10 inline-block">ZING!!!</span>
      </h1>
      <p class="text-lg md:text-2xl text-stone-500 font-light leading-relaxed">
        Não perca vendas por não estar no Google. A nossa inteligência artificial cria, escreve e publica o seu site automaticamente. Preencha o menu ao lado e veja a mágica acontecer.
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-6 relative z-10 animate-up" style="animation-delay: 0.2s;">
      <div class="glass-card p-8 rounded-[2rem] relative overflow-hidden group" onclick="window.parent.postMessage({ type: 'OPEN_PLAN_MODAL', plan: 'free' }, '*')">
        <img src="${BRAND_LOGO}" class="plan-bg-logo" />
        <div class="absolute top-0 right-0 bg-stone-200 text-stone-700 text-[9px] font-black tracking-widest px-4 py-2 rounded-bl-2xl uppercase">Sem pagamento antecipado</div>
        <h3 class="text-2xl font-black mb-1 italic uppercase text-stone-800 mt-2">Teste Grátis</h3>
        <p class="text-stone-500 mb-6 text-sm">Veja o seu site pronto hoje mesmo.</p>
        <div class="text-4xl font-black mb-1 text-teal-600">R$ 0 <span class="text-sm text-stone-400 font-normal">/ 7 dias</span></div>
        <p class="text-[11px] text-teal-500 font-bold mb-6">Todos os recursos disponíveis em qualquer plano.</p>
        <ul class="space-y-3 text-stone-600 text-sm font-medium">
          <li class="flex items-center gap-3"><span class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px]">✔</span> Geração por IA</li>
          <li class="flex items-center gap-3"><span class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px]">✔</span> Domínio gratuito (.web.app)</li>
        </ul>
        <div class="mt-6 text-[10px] text-stone-400 text-center uppercase tracking-widest font-bold group-hover:text-orange-500 transition-colors">Clique para ver regras</div>
      </div>

      <div class="glass-card p-8 rounded-[2rem] relative overflow-hidden group border-teal-200" onclick="window.parent.postMessage({ type: 'OPEN_PLAN_MODAL', plan: 'monthly' }, '*')">
        <img src="${BRAND_LOGO}" class="plan-bg-logo" />
        <div class="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-black tracking-widest px-4 py-2 rounded-bl-2xl uppercase shadow-md">Mais Assinado</div>
        <h3 class="text-2xl font-black mb-1 italic uppercase text-teal-600 mt-2">Mensal</h3>
        <p class="text-stone-500 mb-6 text-sm">Ideal para validar seu negócio.</p>
        <div class="text-4xl font-black mb-1 text-stone-900">R$ 49<span class="text-2xl">,90</span> <span class="text-sm text-stone-400 font-normal">/ mês</span></div>
        <p class="text-[11px] text-stone-500 font-bold mb-6">Todos os recursos disponíveis em qualquer plano.</p>
        <ul class="space-y-3 text-stone-600 text-sm font-medium">
          <li class="flex items-center gap-3"><span class="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-[10px]">✔</span> Site online 24/7</li>
          <li class="flex items-center gap-3"><span class="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-[10px]">✔</span> Domínio próprio (.com.br)</li>
        </ul>
        <div class="mt-6 text-[10px] text-stone-400 text-center uppercase tracking-widest font-bold group-hover:text-orange-500 transition-colors">Clique para ver regras</div>
      </div>

      <div class="glass-card p-8 rounded-[2rem] relative overflow-hidden border-orange-300 bg-white shadow-[0_20px_50px_-12px_rgba(249,115,22,0.15)] group" onclick="window.parent.postMessage({ type: 'OPEN_PLAN_MODAL', plan: 'annual' }, '*')">
        <img src="${BRAND_LOGO}" class="plan-bg-logo" style="opacity: 0.06;" />
        <div class="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-[10px] font-black tracking-widest px-4 py-2 rounded-bl-2xl uppercase flex gap-1.5 items-center justify-center shadow-lg">
          <span class="leading-none">Mais Econômico</span>
        </div>
        <h3 class="text-2xl font-black mb-1 italic uppercase text-orange-500 mt-2">Anual</h3>
        <p class="text-stone-500 mb-6 text-sm">A solução definitiva e econômica.</p>
        <div class="text-4xl font-black mb-1 text-stone-900">R$ 499 <span class="text-sm text-stone-400 font-normal">/ 1º ano</span></div>
        <p class="text-[11px] text-orange-500 font-bold mb-6">Todos os recursos disponíveis em qualquer plano.</p>
        <ul class="space-y-3 text-stone-600 text-sm font-medium">
          <li class="flex items-center gap-3"><span class="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-[12px]">★</span> 2 meses grátis</li>
          <li class="flex items-center gap-3"><span class="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-[12px]">★</span> Apontamento de Domínio</li>
        </ul>
        <div class="mt-6 text-[10px] text-stone-400/80 text-center uppercase tracking-widest font-bold group-hover:text-orange-600 transition-colors">Clique para ver regras</div>
      </div>
    </div>
  </main>
</body>
</html>
`;

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

const PLAN_DETAILS = {
  free: {
    title: "Plano Teste Grátis",
    price: "R$ 0,00",
    period: "por 7 dias",
    color: "text-stone-800",
    bgBadge: "bg-stone-200 text-stone-700",
    badge: "Sem pagamento antecipado",
    rules: [
      "Acesso completo à Inteligência Artificial da plataforma.",
      "Geração, edição e publicação de site grátis.",
      "Hospedagem segura com subdomínio (.web.app).",
      "Após 7 dias, o site é congelado automaticamente caso não haja assinatura.",
      "Sem necessidade de cadastrar cartão de crédito para testar."
    ]
  },
  monthly: {
    title: "Plano Mensal",
    price: "R$ 49,90",
    period: "/ mês",
    color: "text-teal-600",
    bgBadge: "bg-teal-600 text-white",
    badge: "Mais Assinado",
    rules: [
      "Site online 24/7 com alta estabilidade (Google Cloud).",
      "Conexão liberada para domínio próprio profissional (ex: .com.br).",
      "Cobrança recorrente mensal no cartão de crédito.",
      "Cancele quando quiser diretamente pelo painel, sem multas ou fidelidade.",
      "Suporte prioritário e blindagem de segurança no Google."
    ]
  },
  annual: {
    title: "Plano Anual",
    price: "R$ 499,00",
    period: "/ 1º ano",
    color: "text-orange-500",
    bgBadge: "bg-gradient-to-r from-orange-500 to-orange-400 text-white",
    badge: "Mais Econômico",
    rules: [
      "Desconto equivalente a 2 meses grátis em relação ao plano mensal.",
      "Apontamento de domínio premium configurado para você.",
      "Alta velocidade de carregamento para otimização SEO no Google.",
      "Ciclo de renovação a cada 12 meses, garantindo o menor preço do ano."
    ]
  }
};

const App: React.FC = () => {
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [aiContent, setAiContent] = useState<any>(null);
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedPlanModal, setSelectedPlanModal] = useState<'free' | 'monthly' | 'annual' | null>(null);
  const [checkoutTermsAccepted, setCheckoutTermsAccepted] = useState(false);
  const [cancelModalProject, setCancelModalProject] = useState<string | null>(null);
  const [cancelTermsAccepted, setCancelTermsAccepted] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const [loggedUserEmail, setLoggedUserEmail] = useState<string | null>(auth.currentUser?.email || null);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'dominio' | 'assinatura'>('geral');
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
  const [isDnsModalOpen, setIsDnsModalOpen] = useState(false);

  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'|'warning'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);

  const [formData, setFormData] = useState({
    businessName: '', description: '', region: '', whatsapp: '', instagram: '', facebook: '', linkedin: '', tiktok: '',
    ifood: '', noveNove: '', keeta: '', phone: '', email: '', address: '', showMap: true,
    showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa', 
    logoBase64: '', logoSize: 40
  });

  useIframeEditor({ setGeneratedHtml, setHasUnsavedChanges });

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = BRAND_LOGO;
    document.title = "SiteZing - Seu site pronto em um ZING !!!";
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'OPEN_PLAN_MODAL') {
        setSelectedPlanModal(e.data.plan);
        setCheckoutTermsAccepted(false); 
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (aiContent) {
      setGeneratedHtml(prevHtml => {
        const extractedImages = extractCustomImages(prevHtml);
        return renderTemplate(aiContent, formData, extractedImages);
      });
    }
  }, [formData.layoutStyle, formData.colorId, formData.logoBase64, formData.logoSize, formData.whatsapp, formData.instagram, formData.facebook, formData.linkedin, formData.tiktok, formData.ifood, formData.noveNove, formData.keeta, formData.showForm, formData.showFloatingContact, formData.showMap, formData.address, formData.phone, formData.email, formData.region]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setLoggedUserEmail(user?.email || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success'|'error'|'info'|'warning' = 'info') => {
    setToast({ message, type });
  };

  const fetchProjects = async () => {
    if (!auth.currentUser) return setSavedProjects([]);
    try {
      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);
    } catch { setSavedProjects([]); }
  };

  useEffect(() => { fetchProjects(); }, [loggedUserEmail]);

  const renderTemplate = (content: any, data: typeof formData, customImages: Record<string, string> = {}) => {
    let html = TEMPLATES[data.layoutStyle] || TEMPLATES['layout_modern_center'];
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

    let headInjection = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">';
    
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

    replaceAll('[[SOCIAL_LINKS]]', socialHtml);

    const headerContactBtn = data.showForm 
      ? `<a href="#contato" class="btn-contact-premium"><span class="desktop-text">Fale Conosco</span><i class="fas fa-comment-dots mobile-icon"></i></a>` 
      : ``;
    replaceAll('[[HEADER_CONTACT_BTN]]', headerContactBtn);

    const footerBrand = `<div style="text-align:center; padding: 24px; font-size: 12px; opacity: 0.5; width: 100%; font-family: sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px;">Criado por <a href="https://sitezing.com.br" target="_blank" style="text-decoration: none; font-weight: 900; display: flex; align-items: center; gap: 4px; color: inherit; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'"><img src="${BRAND_LOGO}" style="height: 16px; width: auto;" alt="SiteZing"/> SiteZing.com.br</a></div>`;
    html = html.replace('</body>', `${footerBrand}</body>`);

    const mapUrl = data.address ? `https://maps.google.com/maps?q=${encodeURIComponent(data.address)}&t=&z=13&ie=UTF8&iwloc=&output=embed` : '';
    const mapCode = (data.showMap && mapUrl) ? `<div class="overflow-hidden rounded-[2rem] mt-6 map-container ux-glass"><iframe src="${mapUrl}" width="100%" height="240" style="border:0;" loading="lazy"></iframe></div>` : '';
    replaceAll('[[MAP_AREA]]', mapCode);
    
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
      fetchProjects(); 
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
          fetchProjects();
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
      fetchProjects();
    } catch (error: any) {
      showToast('Erro ao verificar: ' + error.message, 'error');
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.businessName || !formData.description) return showToast('Preencha Nome e Ideia para gerar!', 'error');
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
      const generateFn = httpsCallable(functions, 'generateSite');
      const result: any = await generateFn({ businessName: formData.businessName, description: formData.description, region: formData.region });
      setAiContent(result.data);
      const extractedImages = extractCustomImages(generatedHtml);
      setGeneratedHtml(renderTemplate(result.data, formData, extractedImages));
      setHasUnsavedChanges(true);
      showToast('Site gerado com inteligência artificial!', 'success');
    } catch (error: any) { showToast('Erro na geração: ' + error.message, 'error'); } 
    finally { setIsGenerating(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setFormData(p => ({ ...p, logoBase64: reader.result as string })); setHasUnsavedChanges(true); };
    reader.readAsDataURL(file);
  };

  const handleSaveOrUpdateSite = async () => {
    if (!auth.currentUser) return setIsLoginOpen(true);
    
    setIsSavingProject(true);
    try {
      const htmlToSave = cleanHtmlForPublishing(generatedHtml);
      if (currentProjectSlug) {
        const updateFn = httpsCallable(functions, 'updateSiteProject');
        await updateFn({ targetId: currentProjectSlug, html: htmlToSave, formData, aiContent });
        showToast('Alterações salvas com sucesso!', 'success');
      } else {
        const cleanName = formData.businessName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const internalDomain = `${cleanName}-${randomSuffix}`;
        
        const saveFn = httpsCallable(functions, 'saveSiteProject');
        const res: any = await saveFn({ 
            businessName: formData.businessName, 
            officialDomain: officialDomain || "Pendente", 
            internalDomain, 
            generatedHtml: htmlToSave, 
            formData, 
            aiContent 
        });
        if (res.data?.projectSlug) setCurrentProjectSlug(res.data.projectSlug);
        showToast('Projeto criado e salvo!', 'success');
      }
      setHasUnsavedChanges(false);
      fetchProjects();
    } catch (err: any) { showToast('Erro ao salvar o site.', 'error'); } 
    finally { setIsSavingProject(false); }
  };

  const handlePublishSite = async () => {
    if (hasUnsavedChanges) return showToast("Salve suas alterações antes de publicar.", "warning");
    setIsPublishing(true);
    try {
      const project = savedProjects.find(p => p.id === currentProjectSlug);
      const isAlreadyPublished = Boolean(project?.publishUrl || project?.status === 'active');
      setIsUpdatePublish(isAlreadyPublished);

      const publishFn = httpsCallable(functions, 'publishUserProject');
      const res: any = await publishFn({ targetId: currentProjectSlug });
      
      let publicUrl = res.data?.publishUrl || `https://${project?.internalDomain || currentProjectSlug}.web.app`;
      if (!publicUrl.startsWith('http')) publicUrl = `https://${publicUrl}`;
      
      fetchProjects(); 
      setPublishModalUrl(publicUrl);
    } catch (err: any) { showToast('Erro ao publicar: ' + err.message, 'error'); } 
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
            setFormData({ businessName: '', description: '', region: '', whatsapp: '', instagram: '', facebook: '', linkedin: '', tiktok: '', ifood: '', noveNove: '', keeta: '', phone: '', email: '', address: '', showMap: true, showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa', logoBase64: '', logoSize: 40 });
          }
          fetchProjects();
        } catch (error) { showToast("Erro ao excluir o site.", "error"); }
        setConfirmDialog(null);
      }
    });
  };

  const handleStripeCheckout = async (projectId: string, planType: 'mensal' | 'anual') => {
    if (!projectId) return;
    setCheckoutLoading(projectId);
    try {
      const createCheckoutFn = httpsCallable(functions, 'createStripeCheckoutSession');
      const res: any = await createCheckoutFn({ projectId, origin: window.location.origin, planType });
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
      fetchProjects(); 
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
      fetchProjects();
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
  };

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
                    <br/><span className="text-xs text-orange-600 italic block mt-1">* Dica de Ouro: Se o painel já possuir apontamentos do tipo "A" ou "CNAME" conflitantes, exclua os antigos primeiro.</span>
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
                        <button onClick={() => { navigator.clipboard.writeText('199.36.158.100'); showToast('IP copiado!', 'success'); }} className="text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm border border-teal-100"><Copy size={14}/> Copiar</button>
                      </div>
                    </div>

                    {/* Linha 2: CNAME (WWW) */}
                    <div className="p-4 grid grid-cols-12 gap-3 border-b border-stone-100 text-sm items-center hover:bg-stone-50 transition-colors">
                      <div className="col-span-4 font-mono text-stone-800 font-bold">www</div>
                      <div className="col-span-2 font-black text-stone-800">CNAME</div>
                      <div className="col-span-6 flex justify-between items-center bg-teal-50 border border-teal-100 px-3 py-2 rounded-lg">
                        <span className="font-mono text-teal-700 font-bold select-all truncate">{currentProjectSlug}.web.app</span>
                        <button onClick={() => { navigator.clipboard.writeText(`${currentProjectSlug}.web.app`); showToast('Destino copiado!', 'success'); }} className="text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm border border-teal-100 shrink-0 ml-2"><Copy size={14}/> Copiar</button>
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
                          <button onClick={() => { navigator.clipboard.writeText(domainRecords[0]?.records[0]?.text || `firebase-site-verification=${currentProjectSlug}-app`); showToast('TXT copiado!', 'success'); }} className="text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm border border-teal-100 shrink-0 ml-2"><Copy size={14}/> Copiar</button>
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

      <div className="w-full h-screen bg-[#FAFAF9] overflow-hidden font-sans text-stone-900 flex flex-col md:flex-row">
        
        <div className="flex-1 relative h-full overflow-hidden bg-[#FAFAF9]">
          <iframe 
            srcDoc={generatedHtml ? getPreviewHtml(generatedHtml) : PROMO_HTML} 
            className="w-full h-full border-none bg-transparent" 
            title="Visão Principal" 
          />

          <AnimatePresence>
            {!isMenuOpen && (
              <div 
                className="absolute top-6 right-6 z-[90] flex items-center cursor-pointer group" 
                onClick={() => setIsMenuOpen(true)}
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 2], opacity: [0.6, 0] }} 
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} 
                    className="absolute w-12 h-12 bg-orange-400 rounded-full" 
                  />
                  <div className="relative flex items-center gap-2 bg-white px-5 py-3 rounded-full border border-orange-200 shadow-lg group-hover:shadow-orange-500/20 transition-all group-hover:border-orange-400">
                    <Rocket size={18} className="text-orange-500" />
                    <span className="text-sm font-black uppercase tracking-widest text-orange-600">Crie seu Site</span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <Suspense fallback={null}>
          <LoginPage isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSubmit={handleLoginSubmit} brandLogo={BRAND_LOGO} />
        </Suspense>

        <AnimatePresence initial={false}>
          {isMenuOpen && (
            <motion.div 
              initial={{ width: 0, paddingLeft: 0, paddingRight: 0 }} 
              animate={{ width: window.innerWidth < 768 ? '100%' : 420, paddingLeft: 16, paddingRight: 16 }} 
              exit={{ width: 0, paddingLeft: 0, paddingRight: 0 }} 
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="flex-shrink-0 h-full flex flex-col justify-center overflow-hidden relative z-50 bg-[#FAFAF9] w-full md:w-[420px] py-4"
            >
              <motion.div 
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ delay: 0.1 }}
                className="w-full h-full bg-[#F8FAFC] border border-stone-200 rounded-[2rem] shadow-xl flex flex-col overflow-hidden relative"
              >
                <div className="flex justify-between items-center px-6 py-5 border-b border-stone-200 flex-shrink-0 bg-white">
                  <div className="flex items-center gap-3 select-none">
                    <img src={BRAND_LOGO} alt="SiteZing" className="h-10 w-auto object-contain" />
                  </div>
                  <div className="flex items-center gap-4">
                    {loggedUserEmail ? (
                      <button className="text-stone-400 hover:text-teal-500 transition-colors" title={`Logado como: ${loggedUserEmail}`}><User size={18} /></button>
                    ) : (
                      <button onClick={() => setIsLoginOpen(true)} className="text-xs font-bold text-teal-600 hover:text-teal-500 transition-colors flex items-center gap-1.5"><LogIn size={16} /> Login</button>
                    )}
                    <div className="w-px h-4 bg-stone-200"></div>
                    <button onClick={() => setIsMenuOpen(false)} className="text-stone-400 hover:text-stone-800 transition-colors" title="Esconder Painel"><X size={18} /></button>
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
                        <button onClick={() => setActiveTab('assinatura')} className={`flex-1 py-3 sm:py-3.5 text-center transition-colors relative ${activeTab === 'assinatura' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}`}>
                          Pagamento
                          {!isPaid && (
                            <span className="absolute top-3 right-2 flex h-2 w-2"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${daysLeft > 0 ? 'bg-yellow-400' : 'bg-red-400'}`}></span><span className={`relative inline-flex rounded-full h-2 w-2 ${daysLeft > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></span></span>
                          )}
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
                        <div><label className="text-xs font-bold text-stone-500 uppercase flex gap-2 mb-1.5"><Briefcase size={12} /> Nome do Negócio</label><input className="w-full bg-white border border-stone-200 rounded-xl p-3.5 text-sm focus:border-teal-500 outline-none transition-colors" placeholder="Ex: Eletricista Silva" value={formData.businessName} onChange={e => {setFormData({ ...formData, businessName: e.target.value }); setHasUnsavedChanges(true)}} /></div>
                           <div><label className="text-xs font-bold text-stone-500 uppercase flex gap-2 mb-1.5"><FileText size={12} /> Ideia Principal</label><textarea className="w-full h-20 bg-white border border-stone-200 rounded-xl p-3.5 text-sm resize-none focus:border-teal-500 outline-none transition-colors" placeholder="Descreva os serviços..." value={formData.description} onChange={e => {setFormData({ ...formData, description: e.target.value }); setHasUnsavedChanges(true)}} /></div>
                      </div>

                      <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-stone-700 transition-colors shadow-md">
                        {isGenerating ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />} {generatedHtml ? 'Recriar Site c/ IA' : 'Gerar Meu Site'}
                      </button>

                      {generatedHtml && (
                        <div className="pt-6 border-t border-stone-100 space-y-6">
                          <div className="space-y-2.5"><label className="text-xs font-bold text-stone-500 uppercase">Estilo do Site</label><select className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm outline-none" value={formData.layoutStyle} onChange={e => {setFormData({ ...formData, layoutStyle: e.target.value }); setHasUnsavedChanges(true)}}>{LAYOUT_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
                          
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
                                  <input type="range" min="20" max="100" value={formData.logoSize || 40} onChange={e => {setFormData({ ...formData, logoSize: parseInt(e.target.value) }); setHasUnsavedChanges(true)}} className="w-full accent-teal-500" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3 pt-5 border-t border-stone-100">
                            <label className="text-xs font-bold text-stone-500 uppercase flex gap-1.5"><Globe size={14} /> Redes Sociais & Delivery</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="WhatsApp (só números)" value={formData.whatsapp} onChange={e => {setFormData({ ...formData, whatsapp: e.target.value }); setHasUnsavedChanges(true)}} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Instagram (@usuario)" value={formData.instagram} onChange={e => {setFormData({ ...formData, instagram: e.target.value }); setHasUnsavedChanges(true)}} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Facebook (Link)" value={formData.facebook} onChange={e => {setFormData({ ...formData, facebook: e.target.value }); setHasUnsavedChanges(true)}} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="LinkedIn (Link)" value={formData.linkedin} onChange={e => {setFormData({ ...formData, linkedin: e.target.value }); setHasUnsavedChanges(true)}} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="TikTok (Link ou @)" value={formData.tiktok} onChange={e => {setFormData({ ...formData, tiktok: e.target.value }); setHasUnsavedChanges(true)}} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="iFood (Link)" value={formData.ifood} onChange={e => {setFormData({ ...formData, ifood: e.target.value }); setHasUnsavedChanges(true)}} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="99 Food (Link)" value={formData.noveNove} onChange={e => {setFormData({ ...formData, noveNove: e.target.value }); setHasUnsavedChanges(true)}} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Keeta (Link)" value={formData.keeta} onChange={e => {setFormData({ ...formData, keeta: e.target.value }); setHasUnsavedChanges(true)}} />
                            </div>
                          </div>

                          <div className="space-y-3 pt-5 border-t border-stone-100">
                            <label className="text-xs font-bold text-stone-500 uppercase flex gap-1.5"><MapPin size={14} /> Contato e Localização</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Telefone" value={formData.phone} onChange={e => {setFormData({ ...formData, phone: e.target.value }); setHasUnsavedChanges(true)}} />
                              <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="E-mail" value={formData.email} onChange={e => {setFormData({ ...formData, email: e.target.value }); setHasUnsavedChanges(true)}} />
                            </div>
                            <input className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:border-teal-500 outline-none" placeholder="Endereço Físico" value={formData.address} onChange={e => {setFormData({ ...formData, address: e.target.value }); setHasUnsavedChanges(true)}} />
                            
                            <label className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600"><span>Exibir Mapa do Google</span><input type="checkbox" checked={formData.showMap} onChange={e => {setFormData({ ...formData, showMap: e.target.checked }); setHasUnsavedChanges(true)}} className="accent-teal-500" /></label>
                            <label className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600"><span>Exibir formulário de contato</span><input type="checkbox" checked={formData.showForm} onChange={e => {setFormData({ ...formData, showForm: e.target.checked }); setHasUnsavedChanges(true)}} className="accent-teal-500" /></label>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'dominio' && generatedHtml && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      {!currentProjectSlug ? (
                        <div className="bg-teal-50/50 p-5 rounded-2xl border border-teal-100">
                          <h4 className="text-sm font-bold text-teal-700 flex items-center gap-2"><Globe size={16}/> Qual será o endereço?</h4>
                          <p className="text-xs text-teal-600/80 mb-5 leading-relaxed">Antes de salvar, precisamos saber se você vai usar um domínio oficial (Ex: Registro.br).</p>
                          <Suspense fallback={null}><DomainChecker onDomainChange={(domain, isLater) => { setOfficialDomain(domain); setRegisterLater(isLater); }} /></Suspense>
                        </div>
                      ) : (() => {
                        const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                        const hasCustomDomain = currentProject?.officialDomain && currentProject.officialDomain !== 'Pendente' && !currentProject.officialDomain.includes('.web.app');
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
                                    <h4 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2"><Star size={16} className="text-orange-500"/> Obtenha seu endereço oficial</h4>
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
                                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${isDomainActive ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700 animate-pulse'}`}>
                                        {isDomainActive ? 'Propagado' : 'Pendente'}
                                      </span>
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

                  {activeTab === 'assinatura' && currentProjectSlug && (() => {
                    const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                    
                    const expirationDate = currentProject?.expiresAt ? (currentProject.expiresAt._seconds ? currentProject.expiresAt._seconds * 1000 : currentProject.expiresAt.seconds * 1000) : null;
                    const daysLeft = expirationDate ? Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
                    
                    const isPaid = currentProject?.paymentStatus === 'paid';
                    const isCanceled = currentProject?.cancelAtPeriodEnd === true || currentProject?.subscriptionStatus === 'canceled';
                    
                    // Lógica para verificar se o projeto congelou ou venceu (CORRIGIDA)
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

                          {/* Se for pago E cancelado (ainda no ar), botão para retomar */}
                          {isPaid && isCanceled && daysLeft > 0 ? (
                            <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl text-center space-y-4 relative z-10">
                              <h4 className="font-black text-orange-700 text-lg uppercase tracking-wider">Assinatura Cancelada</h4>
                              <p className="text-xs text-orange-600/80">Seu site continuará no ar até o fim do ciclo pago. Deseja reativar a renovação automática para não perdê-lo?</p>
                              <button 
                                onClick={() => handleResumeSubscription(currentProjectSlug)} 
                                disabled={isResuming} 
                                className="bg-orange-500 text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors w-full"
                              >
                                {isResuming ? <Loader2 className="animate-spin inline mr-2"/> : <RefreshCw className="inline mr-2" size={16}/>} Reativar Assinatura
                              </button>
                            </div>
                          ) : isPaid && !isCanceled ? (
                            /* Se for pago e estiver tudo ok, botão de mudar de plano */
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
                            /* Se for trial (no ar) ou totalmente vencido/congelado (needsPayment), mostra os planos para comprar */
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 gap-4">
                                <div className="bg-white p-5 rounded-xl border border-teal-200 flex flex-col h-full relative overflow-hidden shadow-sm">
                                  <img src={BRAND_LOGO} className="absolute bottom-[-10%] right-[-10%] w-1/2 opacity-[0.03] pointer-events-none filter grayscale" alt="" />
                                  <div className="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg rounded-tr-lg">Mais Assinado</div>
                                  <h4 className="text-teal-600 font-bold mb-2 uppercase tracking-wide text-xs">Plano Mensal</h4>
                                  <div className="flex items-end gap-1 mb-4"><span className="text-3xl font-black text-stone-950">R$ 49,90</span><span className="text-xs text-stone-500 font-medium pb-1">/mês</span></div>
                                  <ul className="space-y-2 text-xs text-stone-600 mb-6 flex-1 relative z-10">
                                    <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5"/> Domínio próprio & Suporte</li>
                                  </ul>
                                  <button onClick={() => { setSelectedPlanModal('monthly'); setCheckoutTermsAccepted(false); }} className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors relative z-10 shadow-lg shadow-teal-500/20">
                                    {needsPayment ? 'Reativar com Plano Mensal' : 'Assinar Mensal'}
                                  </button>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-orange-200 flex flex-col h-full relative overflow-hidden shadow-md">
                                  <img src={BRAND_LOGO} className="absolute bottom-[-10%] right-[-10%] w-1/2 opacity-[0.03] pointer-events-none filter grayscale" alt="" />
                                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg rounded-tr-lg">Mais Econômico</div>
                                  <h4 className="text-orange-500 font-bold mb-2 uppercase tracking-wide text-xs">Plano Anual</h4>
                                  <div className="flex items-end gap-1 mb-4"><span className="text-3xl font-black text-stone-950">R$ 499</span><span className="text-xs text-stone-500 font-medium pb-1">/ano</span></div>
                                  <ul className="space-y-2 text-xs text-stone-600 mb-6 flex-1 relative z-10">
                                    <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5"/> 2 meses grátis equivalentes</li>
                                  </ul>
                                  <button onClick={() => { setSelectedPlanModal('annual'); setCheckoutTermsAccepted(false); }} className="w-full bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors shadow-lg shadow-orange-500/20 relative z-10">
                                    {needsPayment ? 'Reativar com Plano Anual' : 'Assinar Anual'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-8 pt-6 border-t border-stone-100 relative z-10">
                             <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Ações da Conta</h4>
                             {isPaid && !isCanceled ? (
                               <button 
                                 onClick={() => {setCancelModalProject(currentProjectSlug); setCancelTermsAccepted(false)}} 
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
                      <div className="flex items-center justify-between"><p className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2"><LayoutDashboard size={14} className="text-emerald-600"/>Meus Projetos</p><button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase bg-red-50 px-2.5 py-1 rounded-lg">Sair</button></div>
                      <div className="max-h-52 overflow-y-auto space-y-2">
                        {savedProjects.length === 0 ? <p className="text-xs text-stone-400 italic text-center py-4">Nenhum projeto ainda.</p> : (
                          savedProjects.map((p: any) => (
                            <div key={p.id} className="flex gap-1.5 bg-white border border-stone-200 rounded-xl p-2.5 shadow-sm">
                                <button onClick={() => handleLoadProject(p)} className={`flex-1 text-left text-xs bg-stone-50 hover:bg-stone-100 rounded-lg p-3 flex justify-between items-center transition-all ${currentProjectSlug === p.id ? 'ring-1 ring-teal-400' : ''}`}><div className="flex flex-col truncate pr-2"><span className="font-bold text-stone-800 truncate flex items-center gap-2">{p.businessName || 'Sem Nome'} {getStatusBadge(p)}</span><span className="text-[9px] text-stone-400 font-mono mt-1">{p.id}.web.app</span></div></button>
                                <button onClick={() => handleDeleteSite(p.id)} className="w-10 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-lg flex items-center justify-center transition-all flex-shrink-0"><Trash2 size={14} /></button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTÕES DE AÇÃO PRINCIPAIS (COM TRAVA DE VENCIMENTO) */}
                {generatedHtml && (() => {
                  const currentProject = savedProjects.find(p => p.id === currentProjectSlug);
                  const isPublished = Boolean(currentProject?.publishUrl || currentProject?.status === 'active');
                  
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
                        className={`w-full sm:flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${hasUnsavedChanges || !currentProjectSlug ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                      >
                        {isSavingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />} 
                        {currentProjectSlug ? 'Salvar Alterações' : 'Salvar Projeto'}
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
                          onClick={handlePublishSite} 
                          disabled={isPublishing || hasUnsavedChanges || !currentProjectSlug} 
                          className={`w-full sm:flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${!hasUnsavedChanges && currentProjectSlug ? (isPublished ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20') : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                        >
                          {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPublished ? <RefreshCw size={14} /> : <Globe size={14} />)} 
                          {isPublished ? 'Atualizar Publicação' : 'Publicar Site'}
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
    </>
  );
};

export default App;
