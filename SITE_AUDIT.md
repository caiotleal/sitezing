# Auditoria Técnica do Site (SiteZing)

_Data da auditoria: 2026-04-06_

## Escopo executado

- Validação estrutural do frontend (Vite + React + Firebase SDK).
- Validação estrutural do backend (Firebase Functions v2).
- Verificação de compatibilidade entre funções callable usadas no frontend e exports existentes no backend.
- Verificação de presença das variáveis de ambiente críticas do Firebase.
- Testes de build e checagem de sintaxe.
- Testes de conectividade de APIs externas (Firebase/Auth, Generative Language, Hosting e Cloud Functions).

## Resultado geral

- ✅ Build do frontend concluído com sucesso.
- ✅ Sintaxe do backend válida.
- ✅ Todas as funções callable usadas no frontend existem no backend.
- ✅ Variáveis críticas de ambiente do frontend encontradas.
- ⚠️ Testes de conectividade HTTP externa bloqueados pelo ambiente (proxy retornando `CONNECT tunnel failed, response 403`).

## Evidências técnicas

### 1) Build e integridade

- `npm run build` (raiz): sucesso com warning de chunk grande no bundle principal.
- `node --check functions/index.js`: sucesso.

### 2) API/Conexões (validação automatizada)

Arquivo gerado: `site-validation-report.json`.

Resumo do relatório:

- `frontendEnvAllPresent: true`
- `callableCountUsed: 20`
- `callableCountExported: 38`
- `missingBackendFunctions: []`
- `apiChecksRun: 4`

### 3) Limitações encontradas

As verificações reais de reachability dos endpoints externos falharam por restrição de rede do ambiente de execução (proxy), não por erro de código:

- Identity Toolkit
- Generative Language (Imagen)
- Hosting `*.web.app`
- Endpoint de Function `cloudfunctions.net`

## Recomendações objetivas

1. Executar `npm run validate:site` em um ambiente com saída de rede liberada para confirmação 100% end-to-end.
2. Reduzir o tamanho do bundle principal com code splitting adicional (warning atual do Vite).
3. Adicionar esta validação no CI antes de deploy (`validate:site` + `build`).
