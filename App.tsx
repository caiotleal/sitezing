import React, { Suspense, lazy, useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, functions, db } from './firebase';
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

// DOMÍNIOS DA PLATAFORMA QUE CARREGAM O EDITOR
const BUILDER_DOMAINS = ['localhost', 'sitezing.com.br', 'www.sitezing.com.br', 'criador-de-site-1a91d.web.app', 'criador-de-site-1a91d.firebaseapp.com'];

const App: React.FC = () => {

  // ==============================================================================
  // INTERCEPTADOR DE SUBDOMÍNIO (WILDCARD) E DOMÍNIO CUSTOMIZADO DO CLIENTE
  // ==============================================================================
  const [isClientSiteView, setIsClientSiteView] = useState(false);

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
        } catch(error: any) {
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
  const [selectedPlanModal, setSelectedPlanModal] = useState<'free' | 'monthly' | 'annual' | null>(null);
  const [checkoutDetailsModal, setCheckoutDetailsModal] = useState<{projectId: string, planType: 'mensal' | 'anual'} | null>(null);
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
    showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa', 
    logoBase64: '', logoSize: 40, segment: '', googlePlaceUrl: '', showReviews: false, reviews: [] as any[], editorialSummary: '',
    customSlug: '', isCustomSlugEdited: false, googlePhotos: [] as string[]
  });
  const [pendingSave, setPendingSave] = useState(false);

  const [showFloatModal, setShowFloatModal] = useState(false);
  const [floatDomainStatus, setFloatDomainStatus] = useState<{ loading: boolean; available?: boolean; slug?: string; alternatives?: string[] }>({ loading: false });
  const floatCheckTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<{type: 'success'|'error', msg: string}|null>(null);
  const [pendingGoogleData, setPendingGoogleData] = useState<any>(null);

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

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'OPEN_PLAN_MODAL') {
        setSelectedPlanModal(e.data.plan);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!generatedHtml && !currentProjectSlug && !isClientSiteView) {
      const timer = setTimeout(() => setShowFloatModal(true), 10000);
      return () => clearTimeout(timer);
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
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoggedUserEmail(user?.email || null);
      if (user) {
        try {
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: user.displayName || '',
            authProvider: user.providerData?.[0]?.providerId || 'password',
            lastLogin: serverTimestamp()
          }, { merge: true });
        } catch (error) { console.error("Erro ao salvar lead", error); }
      }
    });
    return () => unsub();
  }, []);

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

  const showToast = (message: string, type: 'success'|'error'|'info'|'warning' = 'info') => {
    setToast({ message, type });
  };

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
      ? `<a href="#contato" class="btn-contact-premium"><i class="fas fa-comment-dots" style="font-size: 1.25rem;"></i></a>` 
      : ``;
    replaceAll('[[HEADER_CONTACT_BTN]]', headerContactBtn);

    const footerBrand = `<div style="text-align:center; padding: 24px; font-size: 12px; opacity: 0.5; width: 100%; font-family: sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px;">Criado por <a href="https://sitezing.com.br" target="_blank" style="text-decoration: none; font-weight: 900; display: flex; align-items: center; gap: 4px; color: inherit; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'"><img src="${BRAND_LOGO}" style="height: 16px; width: auto;" alt="SiteZing"/> SiteZing.com.br</a></div>`;
    html = html.replace('</body>', `${footerBrand}</body>`);

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

  const handleGenerate = async () => {
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
      const generateFn = httpsCallable(functions, 'generateSite');
      const result: any = await generateFn({ 
        businessName: formData.businessName, 
        description: formData.description, 
        region: formData.region,
        googleContext: formData.showReviews ? JSON.stringify({ summary: formData.editorialSummary, reviews: formData.reviews }) : ''
      });
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

  const slugify = (value = "") => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

  const handleSaveOrUpdateSite = async () => {
    if (!auth.currentUser) {
      setPendingSave(true);
      return setIsLoginOpen(true);
    }
    
    if (!formData.businessName) return showToast('Preencha o Nome do Negócio antes de salvar.', 'warning');

    setIsSavingProject(true);
    try {
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
        if (res.data?.projectSlug) setCurrentProjectSlug(res.data.projectSlug);
        showToast('Projeto criado e salvo!', 'success');
      }
      setHasUnsavedChanges(false);
      
      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);
    } catch (err: any) { 
      if (err.message.includes('já está em uso') || err.message.includes('already-exists')) {
         showToast('Este nome de negócio já está em uso por outro site. Por favor, adicione um diferencial ao nome.', 'error'); 
      } else {
         showToast('Erro ao salvar o site: ' + err.message, 'error'); 
      }
    } 
    finally { setIsSavingProject(false); }
  };

  const handlePublishSite = async () => {
    if (hasUnsavedChanges) return showToast("Salve suas alterações antes de publicar.", "warning");
    setIsPublishing(true);
    try {
      const project = savedProjects.find(p => p.id === currentProjectSlug);
      const isAlreadyPublished = Boolean(project?.publishUrl || project?.status === 'active' || project?.status === 'published');
      setIsUpdatePublish(isAlreadyPublished);

      const publishFn = httpsCallable(functions, 'publishUserProject');
      const res: any = await publishFn({ targetId: currentProjectSlug });
      
      let publicUrl = res.data?.publishUrl;
      if (publicUrl && !publicUrl.startsWith('http')) publicUrl = `https://${publicUrl}`;
      
      const listFn = httpsCallable(functions, 'listUserProjects');
      const listRes: any = await listFn({});
      setSavedProjects(listRes.data?.projects || []);

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
            setFormData({ businessName: '', description: '', region: '', whatsapp: '', instagram: '', facebook: '', linkedin: '', tiktok: '', ifood: '', noveNove: '', keeta: '', phone: '', email: '', address: '', showMap: true, showForm: true, showFloatingContact: true, layoutStyle: 'layout_modern_center', colorId: 'caribe_turquesa', logoBase64: '', logoSize: 40, segment: '', googlePlaceUrl: '', showReviews: false, reviews: [], editorialSummary: '', customSlug: '', isCustomSlugEdited: false });
          }
          
          const listFn = httpsCallable(functions, 'listUserProjects');
          const listRes: any = await listFn({});
          setSavedProjects(listRes.data?.projects || []);
        } catch (error) { showToast("Erro ao excluir o site.", "error"); }
        setConfirmDialog(null);
      }
    });
  };

  const handleStripeCheckout = async (projectId: string, planType: 'mensal' | 'anual') => {
    if (!projectId) return;
    setCheckoutLoading(`${projectId}-${planType}`);
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
                        <span className="font-mono text-teal-700 font-bold select-all truncate">sitezing.com.br</span>
                        <button onClick={() => { navigator.clipboard.writeText(`sitezing.com.br`); showToast('Destino copiado!', 'success'); }} className="text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm border border-teal-100 shrink-0 ml-2"><Copy size={14}/> Copiar</button>
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
          <LoginPage isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSubmit={handleLoginSubmit} />
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
                              onChange={(e) => {setFormData({ ...formData, googlePlaceUrl: e.target.value }); setHasUnsavedChanges(true)}}
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
                              <p className="text-[11px] font-black justify-center text-emerald-800 uppercase flex items-center gap-1.5 mb-1.5"><CheckCircle size={14}/> É esta a empresa?</p>
                              <p className="text-[10px] text-stone-600 mb-3 font-medium px-2 leading-relaxed h-10 line-clamp-2"><span className="font-bold">{pendingGoogleData.name}</span> - {pendingGoogleData.address}</p>
                              <div className="flex gap-2 relative z-10">
                                 <button type="button" onClick={() => setPendingGoogleData(null)} className="flex-1 py-2.5 bg-stone-100 text-stone-500 rounded-lg text-[9px] uppercase font-black tracking-wider hover:bg-stone-200 transition-colors">Voltar</button>
                                 <button type="button" onClick={confirmGoogleInjection} className="flex-[2] py-2.5 px-3 bg-emerald-600 text-white rounded-lg text-[10px] uppercase font-black tracking-widest hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center gap-1.5"><Rocket size={12}/> Confirmar</button>
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
                                <div className="text-[10px] text-stone-400 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin"/> Validando domínio...</div>
                             )}
                             {!floatDomainStatus.loading && formData.customSlug.length >= 3 && floatDomainStatus.available === false && (
                                <div className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> "{floatDomainStatus.slug}" já está em uso! Tente modificar.</div>
                             )}
                             {!floatDomainStatus.loading && formData.customSlug.length >= 3 && floatDomainStatus.available && floatDomainStatus.slug && (
                                <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={10}/> Liberado!</div>
                             )}
                          </div>
                        </div>
                        <div><label className="text-[11px] font-black text-stone-500 uppercase flex items-center gap-1.5 mb-1.5"><FileText size={12} /> Ideia Principal</label><textarea className="w-full h-20 bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-[12px] resize-none focus:border-teal-500 outline-none transition-colors text-stone-800" placeholder="Descreva os serviços..." value={formData.description} onChange={e => {setFormData({ ...formData, description: e.target.value }); setHasUnsavedChanges(true)}} /></div>
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
                            {formData.reviews && formData.reviews.length > 0 && (
                              <label className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-stone-600 font-bold mt-2">
                                <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-emerald-500" /> Exibir Galeria de Avaliações Google</span>
                                <input type="checkbox" checked={formData.showReviews} onChange={e => {setFormData({ ...formData, showReviews: e.target.checked }); setHasUnsavedChanges(true)}} className="accent-emerald-500" />
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
                          <h4 className="text-sm font-bold text-teal-700 flex items-center gap-2"><Globe size={16}/> Qual será o endereço?</h4>
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
                                {isResuming ? <Loader2 className="animate-spin inline mr-2"/> : <RefreshCw className="inline mr-2" size={16}/>} Reativar Assinatura
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
                                <div className="bg-white p-5 rounded-xl border border-teal-200 flex flex-col h-full relative overflow-hidden shadow-sm">
                                  <img src={BRAND_LOGO} className="absolute bottom-[-10%] right-[-10%] w-1/2 opacity-[0.03] pointer-events-none filter grayscale" alt="" />
                                  <div className="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg rounded-tr-lg">Mais Assinado</div>
                                  <h4 className="text-teal-600 font-bold mb-2 uppercase tracking-wide text-xs">Plano Mensal</h4>
                                  <div className="flex items-end gap-1 mb-4"><span className="text-3xl font-black text-stone-950">R$ 49,90</span><span className="text-xs text-stone-500 font-medium pb-1">/mês</span></div>
                                  <ul className="space-y-2 text-xs text-stone-600 mb-6 flex-1 relative z-10">
                                    <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5"/> Domínio próprio & Suporte</li>
                                    <li className="flex items-start gap-2 text-[10px] text-stone-500 mt-4 italic">Sem multa de cancelamento. Sem devoluções de períodos já utilizados. Ao cancelar, o site expira no último dia pago.</li>
                                  </ul>
                                  <button 
                                    onClick={() => setCheckoutDetailsModal({ projectId: currentProjectSlug, planType: 'mensal' })} 
                                    disabled={checkoutLoading === `${currentProjectSlug}-mensal`}
                                    className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors relative z-10 shadow-lg shadow-teal-500/20"
                                  >
                                    {checkoutLoading === `${currentProjectSlug}-mensal` ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : needsPayment ? 'Reativar com Plano Mensal' : 'Assinar Mensal'}
                                  </button>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-orange-200 flex flex-col h-full relative overflow-hidden shadow-md">
                                  <img src={BRAND_LOGO} className="absolute bottom-[-10%] right-[-10%] w-1/2 opacity-[0.03] pointer-events-none filter grayscale" alt="" />
                                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg rounded-tr-lg">Mais Econômico</div>
                                  <h4 className="text-orange-500 font-bold mb-2 uppercase tracking-wide text-xs">Plano Anual</h4>
                                  <div className="flex items-end gap-1 mb-4"><span className="text-3xl font-black text-stone-950">R$ 499</span><span className="text-xs text-stone-500 font-medium pb-1">/ano</span></div>
                                  <ul className="space-y-2 text-xs text-stone-600 mb-6 flex-1 relative z-10">
                                    <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5"/> 2 meses grátis equivalentes</li>
                                    <li className="flex items-start gap-2 text-[10px] text-stone-500 mt-4 italic">Maior economia a longo prazo. Regras de cancelamento sem devolução proporcional aplicáveis. Site online pelos 12 meses inteiros.</li>
                                  </ul>
                                  <button 
                                    onClick={() => setCheckoutDetailsModal({ projectId: currentProjectSlug, planType: 'anual' })} 
                                    disabled={checkoutLoading === `${currentProjectSlug}-anual`}
                                    className="w-full bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors shadow-lg shadow-orange-500/20 relative z-10"
                                  >
                                    {checkoutLoading === `${currentProjectSlug}-anual` ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : needsPayment ? 'Reativar com Plano Anual' : 'Assinar Anual'}
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
      {/* MODAL DOS PLANOS E REGRAS (Vindo do iFrame) */}
      <AnimatePresence>
        {selectedPlanModal && (
          <div className="fixed inset-0 z-[400] bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative"
            >
              <button onClick={() => setSelectedPlanModal(null)} className="absolute top-4 right-4 bg-white/50 hover:bg-white text-stone-500 p-2 rounded-full transition-colors z-20">
                <X size={20} />
              </button>

              <div className={`p-8 pb-10 text-center relative ${
                selectedPlanModal === 'free' ? 'bg-stone-100' :
                selectedPlanModal === 'monthly' ? 'bg-teal-600 text-white' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
              }`}>
                {selectedPlanModal !== 'free' && <div className="absolute inset-0 opacity-10"><img src={BRAND_LOGO} className="w-full h-full object-cover filter blur-sm" alt="" /></div>}
                
                <h2 className="text-3xl font-black uppercase tracking-tight italic relative z-10">
                  {selectedPlanModal === 'free' ? 'Plano Turbo Teste' : selectedPlanModal === 'monthly' ? 'Plano Mensal' : 'Plano Anual Start'}
                </h2>
                
                <div className="mt-4 flex items-center justify-center gap-2 relative z-10">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-80 border border-current px-3 py-1 rounded-full">
                    {selectedPlanModal === 'free' ? 'Sem Compromisso' : 'Liberação Imediata'}
                  </span>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-stone-800">Serviços Disponíveis para você</h4>
                      <p className="text-xs text-stone-500 mt-1">Acesso irrestrito a Inteligência Artificial geradora de sites. Todos os blocos liberados, design ilimitado.</p>
                    </div>
                  </div>
                  {selectedPlanModal !== 'free' && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-stone-800">Domínio Próprio Exclusivo</h4>
                        <p className="text-xs text-stone-500 mt-1">Hospedagem Premium com SSL no Google Cloud e conexão liberada para seu próprio domínio (.com.br).</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Rocket className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-stone-800">Site nas Primeiras Posições</h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Estrutura técnica construída para SEO. Otimizado para captar mais leads no piloto automático.
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedPlanModal(null);
                    setIsMenuOpen(true);
                  }}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg hover:translate-y-[-2px] ${
                    selectedPlanModal === 'free' 
                      ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-stone-900/20' 
                      : selectedPlanModal === 'monthly' ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-teal-500/30'
                      : 'bg-orange-500 text-white hover:bg-orange-400 shadow-orange-500/30'
                  }`}
                >
                  🚀 Criar seu site agora
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
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"/>O site continuará online até o fim do período já pago.</li>
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"/>Após o vencimento, o site será <strong className="text-stone-700">Congelado</strong>.</li>
                    <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"/>Você não será mais cobrado nos próximos meses.</li>
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
                    <label className="text-[10px] uppercase tracking-widest font-black text-blue-800 mb-3 flex items-center justify-center gap-1.5"><MapPin size={14} className="text-blue-600"/> Importação Mágica do Google</label>
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
                            <button type="button" onClick={confirmGoogleInjection} className="flex-[1.5] py-2 bg-emerald-600 text-white rounded-lg text-[9px] uppercase font-black shadow-md hover:bg-emerald-500 transition-all flex justify-center items-center gap-1">Puxar Tudo <Rocket size={10}/></button>
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
                    <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-2.5 flex items-center justify-center gap-1.5"><Globe size={12}/> Seu Link Oficial</label>
                    <div className="flex bg-white border border-stone-200 rounded-xl overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all shadow-sm">
                       <input className="flex-1 bg-transparent px-3 py-3.5 text-[12px] font-mono font-bold text-teal-600 outline-none w-full text-right placeholder:text-stone-300" placeholder="meu-site" value={formData.customSlug} onChange={e => handleCustomSlugChange(e.target.value)} />
                       <span className="bg-stone-50 border-l border-stone-200 px-3 py-3.5 text-[11px] font-bold text-stone-400 flex items-center select-none shadow-inner">.sitezing.com.br</span>
                    </div>

                    <div className="mt-2 min-h-[16px] text-center">
                       {floatDomainStatus.loading && (
                          <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin"/> Mapeando domínio...</div>
                       )}
                       {!floatDomainStatus.loading && formData.customSlug.length >= 3 && floatDomainStatus.available === false && (
                          <div className="text-[10px] text-red-500 font-bold flex items-center justify-center gap-1"><AlertCircle size={10}/> Indisponível. Altere acima!</div>
                       )}
                       {!floatDomainStatus.loading && formData.customSlug.length >= 3 && floatDomainStatus.available && floatDomainStatus.slug && (
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1"><CheckCircle size={10}/> Domínio liberado!</div>
                       )}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                       if (!formData.businessName || floatDomainStatus.available === false) return;
                       setFormData(p => ({ ...p, segment: "Negócios / Geral", description: `Uma empresa moderna e inovadora chamada ${p.businessName}.` }));
                       setTimeout(() => handleGenerate(), 100);
                    }}
                    disabled={isGenerating || !formData.businessName || floatDomainStatus.available === false}
                    className="w-full bg-[#18181b] hover:bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                  >
                    {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <>✨ Começar a Mágica</>}
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
          <div className="fixed inset-0 z-[500] bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] overflow-hidden max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setPublishModalUrl(null)} className="absolute top-4 right-4 bg-stone-100 hover:bg-stone-200 text-stone-500 p-2 rounded-full transition-colors z-20">
                <X size={20} />
              </button>

              <div className="p-8 pb-8 text-center bg-gradient-to-b from-emerald-50 to-white">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                  <Globe className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-stone-900 mb-2">Seu Site está no Ar!</h2>
                <p className="text-sm text-stone-500 font-medium">Parabéns! O projeto foi implantado e já pode ser acessado em todo o mundo através do link abaixo:</p>
                
                <div className="mt-6 bg-stone-100 border border-stone-200 rounded-xl p-4 flex items-center justify-between gap-3 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
                  <span className="font-mono text-emerald-700 font-bold truncate flex-1 text-left select-all">{publishModalUrl}</span>
                  <a href={publishModalUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white border border-stone-200 p-2 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-stone-50 transition-colors shadow-sm">
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              <div className="px-8 pb-8 bg-white">
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6">
                  <h4 className="flex items-center gap-2 text-orange-800 font-black text-sm uppercase mb-2"><AlertCircle size={16}/> Aviso Importante</h4>
                  <p className="text-xs text-orange-700/80 leading-relaxed font-medium">Você está operando atualmente no <span className="font-bold">Plano Turbo Teste (7 Dias)</span>. Caso não possua uma assinatura ativa ao término deste período, seu site será gentilmente congelado para visitantes externos.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setPublishModalUrl(null);
                      setActiveTab('assinatura');
                      setIsMenuOpen(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/30 text-xs"
                  >
                    Garantir Hospedagem e Domínio
                  </button>
                  <button 
                    onClick={() => setPublishModalUrl(null)}
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 py-3 rounded-xl font-bold uppercase tracking-wider transition-colors text-xs"
                  >
                    Continuar Administrando
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONTRATACAO DE PLANO / TERMOS LAB */}
      <AnimatePresence>
        {checkoutDetailsModal && (
          <div className="fixed inset-0 z-[500] bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-[400px] w-full shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-black text-stone-900 uppercase flex items-center gap-2 text-sm"><ShieldCheck className="text-orange-500" size={18} /> Finalizar Contratação</h3>
                <button onClick={() => setCheckoutDetailsModal(null)} className="text-stone-400 hover:text-stone-800 transition-colors bg-white p-1.5 border border-stone-200 rounded-full shadow-sm">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="bg-orange-50 text-orange-800 p-4 rounded-2xl border border-orange-100 mb-6 text-center">
                  <h4 className="font-black text-lg uppercase italic mb-1">
                    Plano {checkoutDetailsModal.planType === 'mensal' ? 'Mensal' : 'Anual'}
                  </h4>
                  <p className="text-xs font-medium opacity-80">Você está a um passo de oficializar sua presença digital.</p>
                </div>

                <h4 className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-4 flex items-center gap-2">
                  <div className="flex-1 h-px bg-stone-100"></div>Entenda Como Funciona<div className="flex-1 h-px bg-stone-100"></div>
                </h4>
                
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5"><CheckCircle size={14} className="text-emerald-600" /></div>
                    <div>
                      <h5 className="font-bold text-stone-800 text-sm">Sem Pegadinhas</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-0.5">Renovação automática pelo Stripe. Cancele com um único clique no painel, quando quiser, sem precisar falar com atendentes.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 border border-orange-200 mt-0.5"><Info size={14} className="text-orange-600" /></div>
                    <div>
                      <h5 className="font-bold text-stone-800 text-sm">Transparência Total</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-0.5">Seu site é hospedado nos melhores servidores do mundo. Ao confirmar, o período é alocado para você. Por ser infraestrutura imediata, não há estorno de dias não utilizados em caso de cancelamento precoce.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 mt-0.5"><RefreshCw size={14} className="text-blue-600" /></div>
                    <div>
                      <h5 className="font-bold text-stone-800 text-sm">Congelamento Seguro</h5>
                      <p className="text-xs text-stone-500 leading-relaxed mt-0.5">Se um pagamento falhar, seu site não some na hora. Ele recebe um aviso e entra em "Congelamento" apenas para visitantes, mantendo os dados seguros conosco durante os próximos dias.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50 mt-auto">
                <button 
                  onClick={() => {
                     const { projectId, planType } = checkoutDetailsModal;
                     setCheckoutDetailsModal(null);
                     handleStripeCheckout(projectId, planType);
                  }}
                  className="w-full bg-stone-900 hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-stone-900/20 text-xs flex items-center justify-center gap-2"
                >
                  ✅ Concordar e ir para o Stripe
                </button>
                <div className="flex items-center justify-center gap-2 mt-4 text-[9px] font-bold text-stone-400 uppercase tracking-widest"><CreditCard size={12}/> Pagamento 100% Seguro</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
