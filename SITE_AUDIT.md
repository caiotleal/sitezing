# Auditoria Técnica do Site (SiteZing)

_Data da auditoria: 2026-04-07_

## Escopo executado (reanálise)

- Validação estrutural do frontend (Vite + React + Firebase SDK).
- Verificação de build de produção e tamanho de bundle.
- Verificação estática de tipos TypeScript (`tsc --noEmit`).
- Validação estrutural do backend (Firebase Functions v2).
- Verificação de compatibilidade entre funções callable usadas no frontend e exports existentes no backend.
- Verificação de presença das variáveis de ambiente críticas do Firebase.

## Resultado geral

- ✅ Build do frontend concluído com sucesso.
- ✅ Validação automatizada (`validate:site`) concluída com sucesso.
- ✅ Todas as funções callable usadas no frontend existem no backend.
- ✅ Variáveis críticas de ambiente do frontend encontradas.
- ⚠️ Erros de tipagem TypeScript identificados (impactam manutenção e confiabilidade).
- ⚠️ Bundle principal ainda está muito grande para carga inicial.

## Evidências técnicas

### 1) Validação de integração do projeto

Comando executado: `npm run validate:site`

Resumo atual do relatório (`site-validation-report.json`):

- `frontendEnvAllPresent: true`
- `callableCountUsed: 20`
- `callableCountExported: 36`
- `missingBackendFunctions: []`
- `apiChecksRun: 4`

### 2) Build de produção

Comando executado: `npm run build`

- Build finalizado sem erro fatal.
- Aviso de chunk grande no arquivo principal:
  - `dist/assets/index-CWo6qFF9.js` com ~1.45 MB (420 KB gzip).
- Aviso de chunking misto do Firestore (import dinâmico e estático simultâneo), reduzindo eficiência do code splitting.

### 3) Tipagem estática (TypeScript)

Comando executado: `npx tsc --noEmit`

Foram encontrados 2 problemas principais:

1. **Inconsistência de tipo em estado/formulário em `App.tsx`**
   - Objeto atribuído não contém campos exigidos pelo tipo (`youtube`, `x`, `rappi`, `zeDelivery`, `directLink`).
   - Risco: regressões silenciosas ao evoluir formulário e serialização de dados.

2. **Símbolo não encontrado em `App.tsx`**
   - `Cannot find name 'Clock'. Did you mean 'Lock'?`
   - Risco: quebra de build em pipelines que exigem TypeScript estrito.

## Lista de melhorias recomendadas (priorizada)

1. **Corrigir imediatamente os 2 erros de TypeScript em `App.tsx`.**
   - Padronizar tipo base do formulário e garantir que todos os merges/spreads incluam os novos campos obrigatórios.
   - Ajustar import/uso do ícone `Clock` (ou substituir corretamente por `Lock`, conforme intenção da UI).

2. **Reduzir o bundle inicial para melhorar performance real (LCP/TTI).**
   - Separar rotas e módulos pesados com `React.lazy` + `Suspense`.
   - Evitar import estático do Firestore quando já existe import dinâmico no fluxo.
   - Definir `manualChunks` no Vite para isolar Firebase, editor e componentes de preview.

3. **Adicionar um gate de qualidade no CI antes de deploy.**
   - Pipeline mínimo recomendado: `npx tsc --noEmit` + `npm run build` + `npm run validate:site`.
   - Bloquear merge em caso de erro de tipo.

4. **Fortalecer monitoramento de experiência do usuário em produção.**
   - Instrumentar Web Vitals (LCP, INP, CLS) e logar por release.
   - Criar meta de orçamento de performance (ex.: chunk inicial < 300 KB gzip por etapa crítica).

5. **Padronizar contrato entre frontend/backend para reduzir drift.**
   - Extrair tipos compartilhados dos payloads callable para um módulo comum.
   - Validar payloads em runtime (ex.: schemas) para reduzir erros de integração.

6. **Melhorar resiliência operacional.**
   - Criar checks de saúde pós-deploy (Auth, Functions e Hosting).
   - Incluir validação automatizada de ambiente (variáveis obrigatórias) no processo de release.

## Conclusão

O projeto está funcional em build de produção e integração principal, mas **há débito técnico importante em tipagem e performance**. A correção dos erros de TypeScript e a redução do bundle inicial devem ser tratadas como prioridade alta para melhorar estabilidade, velocidade e previsibilidade de evolução do produto.
