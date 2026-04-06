import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);

function readText(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(path.join(root, filePath))) return {};
  const lines = readText(filePath).split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

function extractCallableUsages(text) {
  const matches = [...text.matchAll(/httpsCallable\([^,]+,\s*['\"]([^'\"]+)['\"]\)/g)];
  return new Set(matches.map((m) => m[1]));
}

function extractFunctionExports(text) {
  const matches = [...text.matchAll(/exports\.([a-zA-Z0-9_]+)\s*=\s*on(Call|Request|Schedule)\b/g)];
  return new Set(matches.map((m) => m[1]));
}

async function checkHttp(label, url, options = {}) {
  const safeUrl = url.replace(/(key=)[^&]+/i, '$1***REDACTED***');
  try {
    const response = await fetch(url, options);
    return { label, ok: response.ok, status: response.status, url: safeUrl };
  } catch (error) {
    return { label, ok: false, status: null, url: safeUrl, error: String(error) };
  }
}

async function main() {
  const appText = readText('App.tsx');
  const functionsText = readText('functions/index.js');
  const env = {
    ...parseEnvFile('env'),
    ...parseEnvFile('.env.local'),
    ...process.env,
  };

  const requiredFrontendEnv = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const frontendEnvStatus = requiredFrontendEnv.map((key) => ({
    key,
    present: Boolean(env[key]),
  }));

  const callableUsed = extractCallableUsages(appText);
  const callableExported = extractFunctionExports(functionsText);

  const missingOnBackend = [...callableUsed].filter((name) => !callableExported.has(name));

  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY;

  const apiChecks = [];

  if (apiKey) {
    apiChecks.push(await checkHttp(
      'Firebase Identity Toolkit API key validation',
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid@example.com', password: 'invalid', returnSecureToken: true }),
      }
    ));

    apiChecks.push(await checkHttp(
      'Google Generative Language endpoint reachability',
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt: 'test' }], parameters: { sampleCount: 1 } }),
      }
    ));
  }

  if (projectId) {
    apiChecks.push(await checkHttp(
      'Firebase Hosting endpoint',
      `https://${projectId}.web.app`
    ));

    apiChecks.push(await checkHttp(
      'Callable function endpoint (HTTP reachability)',
      `https://us-central1-${projectId}.cloudfunctions.net/getSiteContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { domain: 'example.com' } }),
      }
    ));
  }

  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      frontendEnvAllPresent: frontendEnvStatus.every((e) => e.present),
      callableCountUsed: callableUsed.size,
      callableCountExported: callableExported.size,
      missingBackendFunctions: missingOnBackend,
      apiChecksRun: apiChecks.length,
    },
    frontendEnvStatus,
    callableUsed: [...callableUsed].sort(),
    callableExported: [...callableExported].sort(),
    apiChecks,
  };

  const reportPath = path.join(root, 'site-validation-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`Validation report saved at ${reportPath}`);
  console.log(JSON.stringify(output.summary, null, 2));

  if (missingOnBackend.length > 0 || !frontendEnvStatus.every((e) => e.present)) {
    process.exitCode = 1;
  }
}

await main();
