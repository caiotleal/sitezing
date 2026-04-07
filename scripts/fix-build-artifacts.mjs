import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const target = 'App.tsx';
if (!existsSync(target)) process.exit(0);

const original = readFileSync(target, 'utf8');
let next = original;

next = next.replace(/const\s+renderMobileBottomNav\s*=\s*\(\)\s*=>\s*\*\*\*/g, 'function renderMobileBottomNav() {');
next = next.replace(/\(\)\s*=>\s*\*\*\*/g, '() => {');

if (next !== original) {
  writeFileSync(target, next);
  console.log('[fix-build-artifacts] Corrigido artefato inválido em App.tsx');
} else {
  console.log('[fix-build-artifacts] Nenhum artefato encontrado.');
}
