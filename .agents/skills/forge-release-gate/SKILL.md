---
name: forge-release-gate
description: >-
  Verifies Codegeist 2026 Constitution (gemini.md) invariants, builds root TypeScript and Custom UI, runs regression tests, lints the Forge manifest, and deploys safely on Windows PowerShell before git commit. Use before any release, deploy, or pre-commit check.
---

# Forge Release Gate

Run this verification workflow before finishing any code modification, Forge deployment, or Git commit in `Rovo-World-Model`.

## Step 1: Constitution & Manifest Invariant Check (`gemini.md` Article IV)

Inspect `manifest.yml` and `src/index.ts` to confirm:
1. `manifest.yml` retains `jira:projectPage`, `rovo:agent` (`rovo-world-model-agent`), `rovo:skill` modules (`causal-recovery-advisor`, `critical-path-executive-brief`), `rovo:mcp` (`rovo-world-model-mcp`), reusable `action` modules (`simulate-delay-impact`, `analyze-critical-path`, `seed-demo-scenario`), and the `webtrigger` (`mcp-world-model-endpoint`).
2. Every handler referenced under `function:` in `manifest.yml` is exported in `src/index.ts` (`uiResolverHandler`, `simulateDelayImpactHandler`, `analyzeCriticalPathHandler`, `seedDemoScenarioHandler`, `mcpWebtriggerHandler`).
3. `permissions.scopes` contains only least-privilege scopes (`read:jira-work`, `write:jira-work`, `read:jira-user`, `storage:app`).
4. Zero external backend servers, external databases, Docker dependencies, hardcoded secrets, or fixed `Load Demo Scenario` UI buttons exist.

## Step 2: Build & Test Verification (Windows PowerShell)

Never chain commands with `&&` in Windows PowerShell; always use `; if ($?) { ... }` or separate sequential runs:

```powershell
npm run build; if ($?) { npm test }
```

- Verify `npm run build` compiles both root TypeScript (`npm run typecheck`) and `static/ui/` (`npm run build:ui`) with exit code `0`.
- Verify `npm test` passes all unit and regression tests with `0` failures and `0` skipped tests.

## Step 3: Forge Lint & Development Deploy

```powershell
npx forge lint; if ($?) { npx forge deploy -e development }
```

- Confirm `npx forge lint` outputs `No issues found.` and exits `0`.
- Confirm `npx forge deploy -e development` exits `0` and note the deployed version number.
- If `manifest.yml` changed permissions, Rovo modules (`rovo:skill`, `rovo:mcp`, agent `icon`), or resources, remind the user if Atlassian Cloud requires `npx forge install --upgrade` on existing test sites.

## Step 4: Working Tree Check Before Git Commit

```powershell
git status -sb
```

- Confirm no stray secrets, `.env` files, or unintended artifacts are tracked or left untracked.
