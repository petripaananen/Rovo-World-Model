---
name: rovo-mcp-contract-check
description: >-
  Audits schema, parameter, prompt, and handler synchronization across Rovo actions, Rovo skills, MCP endpoints, Custom UI prompt builders, and documentation. Use whenever modifying Rovo modules, MCP tools, or What-If simulator parameters.
---

# Rovo & MCP Contract Synchronization Check

Follow this 6-point checklist whenever adding or modifying simulation levers, `rovo:agent`, `rovo:skill`, `rovo:mcp`, or `action` definitions.

## 1. Forge `manifest.yml` Constraints
- Confirm `action.inputs` has **at most 10 properties** per action (`maxProperties: 10` in `@forge/manifest`), using only `string`, `integer`, `number`, or `boolean`.
- Confirm `rovo:agent` `name <= 30` chars, `description <= 255` chars, each `conversationStarters` entry `<= 85` chars, and `prompt` contains **zero raw LaTeX syntax** (`$...$`).
- Confirm `rovo:mcp` `name <= 30` chars and coexists with `webtrigger: mcp-world-model-endpoint` (`gemini.md` Article II.2).

## 2. Rovo Skills (`skills/*/SKILL.md`)
- Confirm `source.dir` directory name matches YAML frontmatter `name` (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- Use ONLY allowed frontmatter keys (`name`, `description`, `compatibility`, `metadata`, `license`, `allowed-tools`). Do NOT use `tools:`.
- Ensure `description` is `>= 50` and `<= 1024` chars.
- Ensure space-separated `allowed-tools` includes every key in `dependencies.tools`, and every action key appears in the Markdown body.

## 3. Rovo Action Handlers (`src/rovo/actions.ts`)
- Ensure every input declared in `manifest.yml` and every mitigation flag passed by `src/index.ts` or `src/mcp/server.ts` is parsed, clamped, and reflected in `summaryMarkdown`.
- Forward `cloudId` (`payload.cloudId`, `payload.context?.cloudId`, `context?.cloudId`) to `fetchProjectCausalGraph` so Teamwork Graph GraphQL (`requestGraph`) works in Rovo & MCP contexts too.
- Ensure default target selection works dynamically on any live Jira project (top bottleneck or matching assignee issue), never relying solely on `-104`.

## 4. MCP Server & Resolvers (`src/mcp/server.ts`, `src/index.ts`)
- Keep `MCP_TOOLS_MANIFEST` and `tools/call` arguments aligned with `RovoSimulateDelayPayload`.
- Preserve the `X-PWM-Confirm-Write: true` safety guard on `pwm_seed_demo_scenario` when `populateJiraIssues` is true.
- Forward `cloudId` in both `invokeRovoOrMcpAction` (`src/index.ts`) and `mcpWebtriggerHandler` (`src/mcp/server.ts`).

## 5. Custom UI & Tests (`ScenarioPanel.tsx`, `ROVO_TEST_PROMPTS.md`, `engine.test.ts`)
- Keep `buildRovoMitigationPrompt` in `static/ui/src/components/ScenarioPanel.tsx` aligned with the agent's supported inputs (issue delays, recovery mitigations, multi-issue compounds, and assignee capacity).
- Update `ROVO_TEST_PROMPTS.md` and run `npm run build` + `npm test` to verify end-to-end parity.
