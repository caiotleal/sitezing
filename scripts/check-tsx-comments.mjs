import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'functions/lib']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (extname(full) === '.tsx') out.push(full);
  }
  return out;
}

const files = walk(ROOT);
let hasError = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes('<!--')) {
      hasError = true;
      const rel = file.replace(`${ROOT}/`, '');
      console.error(`[check-tsx-comments] Comentário HTML encontrado em ${rel}:${i + 1}`);
    }
  });
}

if (hasError) {
  console.error('\nUse comentários JSX ({/* ... */}) fora de strings/template literals e remova marcadores inválidos (ex.: ***).');
  process.exit(1);
}

console.log(`[check-tsx-comments] OK - ${files.length} arquivos .tsx verificados.`);
