import { readFileSync, existsSync } from 'node:fs';

const target = 'App.tsx';
if (!existsSync(target)) {
  console.error('[check-app-structure] App.tsx não encontrado.');
  process.exit(1);
}

const src = readFileSync(target, 'utf8');

const checks = [
  { label: 'declaração única renderMobileBottomNav', pattern: /const\s+renderMobileBottomNav\s*=\s*\(/g, expected: 1 },
  { label: 'declaração única getStatusBadge', pattern: /const\s+getStatusBadge\s*=\s*\(/g, expected: 1 },
  { label: 'modal isPlansBannerOpen único', pattern: /\{isPlansBannerOpen && \(/g, expected: 1 },
  { label: 'modal isHowItWorksOpen único', pattern: /\{isHowItWorksOpen && \(/g, expected: 1 },
  { label: 'modal cancelModalProject único', pattern: /\{cancelModalProject && \(/g, expected: 1 },
  { label: 'modal showFloatModal único', pattern: /\{showFloatModal &&/g, expected: 1 },
  { label: 'modal publishModalUrl único', pattern: /\{publishModalUrl && \(/g, expected: 1 },
  { label: 'modal isSaveReminderOpen único', pattern: /\{isSaveReminderOpen && \(/g, expected: 1 },
  { label: 'modal checkoutDetailsModal único', pattern: /\{checkoutDetailsModal && \(/g, expected: 1 },
  { label: 'modal isTrialModalOpen único', pattern: /\{isTrialModalOpen && \(/g, expected: 1 },
  { label: 'modal isSupportModalOpen único', pattern: /\{isSupportModalOpen && \(/g, expected: 1 },
  { label: 'modal isProfileModalOpen único', pattern: /\{isProfileModalOpen && \(/g, expected: 1 },
];

let hasError = false;
for (const check of checks) {
  const count = (src.match(check.pattern) || []).length;
  if (count !== check.expected) {
    hasError = true;
    console.error(`[check-app-structure] Falhou: ${check.label}. Esperado ${check.expected}, encontrado ${count}.`);
  }
}

if (!src.trimEnd().endsWith('export default App;')) {
  hasError = true;
  console.error('[check-app-structure] Falhou: final do arquivo deve terminar com "export default App;".');
}

const mainLayoutCount = src.split('<div className="w-full h-screen bg-[#FAFAF9]').length - 1;
if (mainLayoutCount !== 1) {
  hasError = true;
  console.error(`[check-app-structure] Falhou: layout principal esperado 1, encontrado ${mainLayoutCount}.`);
}

if (hasError) process.exit(1);
console.log('[check-app-structure] OK - estrutura do App.tsx validada.');
