# Rovo-World-Model

**Codegeist 2026 Hackathon Submission ("Build with context. Ship with confidence")**

- **Primary Category:** Apps for Software Teams
- **Bonus Categories Targeted:**
  1. **Best Agents — Rovo / Assignable Agents** (`rovo:agent` with custom SVG icon, 2 reusable `rovo:skill` playbooks, and 3 `action` tools)
  2. **Best App with Atlassian MCP** (native Forge `rovo:mcp` server + JSON-RPC 2.0 `webtrigger` endpoint `mcp-world-model-endpoint`)
  3. **Best Apps with Teamwork Graph Integration** (Townsquare Goals & Confluence ADRs via `requestGraph` + Jira Teams & Issue Links)
  4. **Best Marketplace Published App** (Zero external server dependencies; 100% native Atlassian Forge `nodejs22.x`, least-privilege scopes)

---

## 1. Inspiration & Problem

Modern software delivery fails at the boundaries between teams. Traditional Jira boards and standard LLM text summaries are **correlational and static**—they can summarize what happened yesterday, but they cannot answer **counterfactual (*do*-calculus) questions** such as:

- *"What happens to our release goal if our top bottleneck issue slips by 8 days?"*
- *"Which 3 cross-team blockers on our critical path have the highest downstream blast radius right now?"*
- *"If a key engineer is out for 5 days, should we reassign a parallel bottleneck, serialize work, decouple an interface dependency, or trim non-essential scope (MVP) to protect our **Target Commit Date (85% safe)**?"*

To ship with confidence, engineering teams need a **Causal Project World Model (PWM)**—a live structural causal model (DAG) coupled with a paired **Twin-Network Monte Carlo simulator** that translates complex schedule distributions into clear delivery commitments (**Likely Finish (50% odds)**, **Target Commit Date (85% safe)**, **Safe Buffer Date (95% cutoff)**) and a transparent **3-Tier Schedule Buffer Breakdown** (*Core Work Estimate*, *Team Risk Buffer*, *Executive Contingency*).

---

## 2. What It Does

**Rovo-World-Model** unifies four capabilities into a 100% native Atlassian Forge app:

### 1. Causal DAG & Paired Monte Carlo Engine ([`src/engine/`](./src/engine))
- Constructs a cycle-safe Directed Acyclic Graph (DAG) from live Jira issues and `issuelinks`, supporting all 4 precedence types (`FS`, `SS`, `FF`, `SF`) + lead/lag days, 3-point PERT Beta estimation, and discrete Bernoulli risk shocks.
- Uses three-color DFS to automatically detect and break circular dependencies in live Jira data without crashing.
- Runs **500-iteration Common Random Numbers (CRN) Twin-Network Monte Carlo simulations** in `< 15 ms`, alongside **Brooks's Law** communication/ramp-up physics, person-level WIP contention modeling, and **Hierarchical Engineering Earned Value (`CPI`, `SPI`, `EAC`)**.

### 2. Unified Drag & Drop Custom UI Cockpit ([`static/ui/`](./static/ui))
- **Top App Bar:** Live Jira Project Switcher (`#jira-project-select`), simulation telemetry pill (`500 runs · X ms`), `↻ Sync Jira Project`, conditional **`+ Add Sample Issues`** (shown automatically when viewing an empty or synthetic project), `🎯 Focus Blocker (<key>)`, `⇄ Reset Layout`, and `Reset`.
- **Drag & Drop Panel Arrangement:** Each primary panel (**Project Status**, **Issue Dependency Map**, **Timeline & Sprint Forecast Scrubber**, and **What-If Scenario Simulator**) features a top-corner drag handle (`data-drag-panel`) to reorder columns or swap center views with persisted layout state.
- **Left Executive Command Rail:** 4 high-contrast SVG arch gauges (*On-Time Probability*, *Forecast Spread / Schedule Slip*, *Blocker Float*, *Target Commit*) + hierarchical **Jira Teamwork Graph Goals** status.
- **Center Stage — 4-Shape Issue Dependency Map & Time Machine Scrubber:**
  - Real Jira Team swimlanes (via the Jira `Team` field or `team:` labels, or a unified `No Team Assigned` swimlane), **`● Circle`** (Task / Epic with Sub-task completion ring), **`⬢ Hexagon`** (Critical Path Blocker), **`◆ Diamond`** (Stage Gate / ADR), and **`▬ Stadium Pill`** (Teamwork Graph Goal).
  - Interactive **Quick-Jump Issue Selector** (`#dag-issue-jump-select`), `[` / `]` keyboard stepping, and hover cards displaying explicit **`Blocked by:`** and **`Blocks:`** lineage.
  - **Timeline & Sprint Forecast Scrubber:** 6 sprint milestone buttons, continuous date slider with live finish-odds badge, **3-Tier Schedule Buffer Breakdown**, and **Delivery Confidence Distribution** histogram.
- **Right Column — Unified Single-Card What-If Scenario Simulator:**
  - Seamless single indigo card integrating simulation controls on top and 4 inspector tabs (**`Impacted`**, **`Blockers`**, **`Delivery Health`**, **`AI Action Plan`**) below in a natural downward flow with zero nested/internal scrollbars.
  - Switch cleanly between **`📋 By Issue`** (pin multiple issues with `📌 Pin` for combined counterfactual stacks) and **`👤 By Person & Team`** (unavailability `-3d to +15d`, `⇄ Reassign Bottleneck`, `🧹 Serialize Parallel Work`, and `🤝 Pair on Top Blocker`).
  - **1. Schedule Change (`-5d` to `+30d`)** and **2. Recovery Mitigations** (`+ Assign Extra Developer`, `✂ Decouple Dependency`, `📦 Trim Scope (MVP)`).
  - **Projected Release Impact:** Probability curve, paired **Baseline vs. Simulated** comparison bars with an inline color legend (**Baseline** grey bar vs. **Simulated**: **Same** blue, **Faster** green, **Delayed** red) + explanatory hover tooltips, and **`✨ Ask @Rovo-World-Model Agent`** prompt builder.

### 3. Rovo Agent, 10-Input Action Schema & Reusable Skills ([`manifest.yml`](./manifest.yml), [`skills/`](./skills), [`src/rovo/`](./src/rovo))
- Conversational co-pilot (`rovo-world-model-agent` with custom SVG avatar [`static/icons/rovo-world-model-agent.svg`](./static/icons/rovo-world-model-agent.svg)).
- Exposes 3 Forge `action` modules:
  - `simulate-delay-impact`: 10-input schema supporting `issueKey`, `delayDays` (`-5` to `+60`, auto-defaulting to `0` when mitigations or person parameters are supplied), `addDeveloper`, `decoupleBlockingEdges`, `trimScope`, `assigneeName`, `unavailableDays`, `personMitigation` (`reassign`, `serialize`, `pair`), `compoundOverridesJson`, and `projectKey`.
  - `analyze-critical-path`: topological critical path, negative-float super-critical tasks, Top-3 bottlenecks by downstream ripple weight, 3-tier reserves, and EVM health.
  - `seed-demo-scenario`: populates linked multi-team Jira issues in empty live projects (or initializes the 18-node synthetic causal snapshot).
- Attaches 2 reusable `rovo:skill` modules (`causal-recovery-advisor` and `critical-path-executive-brief`) plus automatic `cloudId` propagation into TWG GraphQL queries (`TownsquareGoal` status, issue-to-goal links, and `ConfluencePage` ADRs).

### 4. Dual Atlassian MCP Server ([`src/mcp/`](./src/mcp))
- **Native Forge MCP (`rovo:mcp`):** `rovo-world-model-mcp` (*Rovo-World-Model MCP*) exposing `simulate-delay-impact`, `analyze-critical-path`, and `seed-demo-scenario` to Rovo Studio and connected MCP clients.
- **JSON-RPC 2.0 Webtrigger (`webtrigger`):** `mcp-world-model-endpoint` supporting `initialize`, `tools/list`, and `tools/call` across 6 tools (`pwm_simulate_intervention`, `pwm_get_critical_path`, `pwm_simulate_delay_impact`, `pwm_analyze_critical_path`, `pwm_seed_demo_scenario`, `pwm_get_causal_graph`) with optional arguments matching full Rovo parity and `X-PWM-Confirm-Write: true` protection on Jira issue creation.

---

## 3. Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                  Atlassian Cloud & Teamwork Graph (TWG)                    │
│        Jira Issues (Blocks / Depends on)  •  Teams  •  TWG Goals           │
└──────────────────┬──────────────────────────────────────┬──────────────────┘
                   │ Jira REST v3 & TWG GraphQL           │ 0-issue fallback
                   ▼                                      ▼
┌───────────────────────────────────┐    ┌───────────────────────────────────┐
│ Live Extractor (src/twg/)         │    │ Zero-Config Fallback & Seeder     │
│ • Three-Color DFS Cycle Breaker   │    │ Project Chronos (18 Nodes)        │
│ • Deterministic Kahn Topo-Sort    │    │ + 1-Click Add Sample Issues       │
└──────────────────┬────────────────┘    └────────────────┬──────────────────┘
                   └──────────────────┬───────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│     Causal Monte Carlo & do-Calculus Engine (src/engine/simulator.ts)      │
│  • 500-Iteration Twin-Network Common Random Numbers (CRN) (< 15 ms)        │
│  • Levers: Issue Shifts, +1 Dev (Brooks), Decouple, Trim MVP, Person WIP   │
│  • Outputs: 50%/85%/95% Confidence, 3-Tier Buffers, EVM, Goal Risk         │
└───────────┬──────────────────────────┬──────────────────────────┬──────────┘
            ▼                          ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│ Custom UI Cockpit    │   │ Rovo Agent & Skills  │   │ MCP Server           │
│ jira:projectPage     │   │ rovo:agent / skill   │   │ rovo:mcp +           │
│ Drag & Drop Panels   │   │ + 3 action Modules   │   │ JSON-RPC 2.0 Endpoint│
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

---

## 4. Repository Structure

| Path | Purpose |
| :--- | :--- |
| [`manifest.yml`](./manifest.yml) | Atlassian Forge app manifest (`nodejs22.x`, `jira:projectPage`, `rovo:agent`, `rovo:skill`, `rovo:mcp`, `action`, `webtrigger`, least-privilege scopes) |
| [`src/index.ts`](./src/index.ts) | Main Forge entrypoint exporting `uiResolverHandler`, Rovo action handlers, and `mcpWebtriggerHandler` |
| [`src/engine/`](./src/engine) | Zero-dependency causal DAG builder (`dag.ts`), CRN Monte Carlo simulator (`simulator.ts`), types (`types.ts`), and 32 unit/regression tests ([`engine.test.ts`](./src/engine/__tests__/engine.test.ts)) |
| [`src/twg/`](./src/twg) | Jira REST + Teamwork Graph GraphQL extractor (`graphFetcher.ts`, `parseTeamworkGraphEdges`) and synthetic/live seeder (`syntheticSeeder.ts`) |
| [`src/rovo/`](./src/rovo) | Rovo action handlers (`actions.ts`: `simulateDelayImpact`, `analyzeCriticalPath`, `seedDemoScenario`) with `cloudId` propagation |
| [`src/mcp/`](./src/mcp) | JSON-RPC 2.0 MCP webtrigger server (`server.ts`) and tool schema definitions |
| [`skills/`](./skills) | Forge `rovo:skill` playbooks (`causal-recovery-advisor`, `critical-path-executive-brief`) |
| [`static/ui/`](./static/ui) | Zero-dependency TypeScript Custom UI cockpit (`cockpit.ts`, `components/`, `styles.css`, `build.mjs`) |
| [`static/icons/`](./static/icons) | Self-contained SVG avatar for `Rovo-World-Model Agent` |
| [`ROVO_TEST_PROMPTS.md`](./ROVO_TEST_PROMPTS.md) | 5 ready-to-use natural language prompts for Jira Rovo Chat demos |
| [`.agents/skills/`](./.agents/skills) | Workspace development skills (`forge-release-gate`, `rovo-mcp-contract-check`) |

---

## 5. MCP Server Usage (JSON-RPC 2.0 Webtrigger & `rovo:mcp`)

Connected IDE/AI clients can inspect tools via `rovo:mcp` in Rovo Studio or send JSON-RPC 2.0 `POST` requests directly to the Forge `webtrigger` URL:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "pwm_simulate_intervention",
    "arguments": {
      "projectKey": "BLP",
      "issueKey": "BLP-1",
      "delayDays": 5,
      "addDeveloper": true,
      "personMitigation": "reassign"
    }
  }
}
```

Write operations (`pwm_seed_demo_scenario` with `populateJiraIssues: true`) require the explicit confirmation header `X-PWM-Confirm-Write: true` so external MCP calls never mutate Jira issues accidentally.

---

## 6. Permissions, Security & Marketplace Readiness

| Scope | Why It Is Needed |
| :--- | :--- |
| `read:jira-work` | Read Jira projects, issues, sub-tasks, estimates, story points, and `issuelinks` |
| `write:jira-work` | Create sample linked Jira issues only when a user clicks `+ Add Sample Issues` or invokes `seed-demo-scenario` with `populateJiraIssues: true` |
| `read:jira-user` | Read assignee display names for workload/capacity contention analysis |
| `storage:app` | Store seeded demo snapshot state in native Forge Storage (`@forge/api`) |

- **User-First Jira Access:** Requests prefer `api.asUser()` to enforce active user browse permissions, falling back cleanly to `api.asApp()` only when invoked without user context (such as unauthenticated `webtrigger` requests).
- **Input Safety & Zero External Servers:** Jira project keys are validated against `/^[A-Z][A-Z0-9_]*$/` before JQL queries, UI text is HTML-escaped, and zero external servers, databases, or manual API keys are required.
- **License:** MIT ([`package.json`](./package.json)).

---

## 7. Judge Quick-Start Instructions (< 2 Minutes)

1. **Open any Jira Project** and click **Rovo-World-Model** in the left project sidebar (or switch live projects from the header dropdown and click **`↻ Sync Jira Project`**).
2. **Zero-Config Ready:** Live Jira issues, sub-tasks, assignees, estimates, and dependency links load automatically. If a test project has `0` issues, click **`+ Add Sample Issues`** in the header to populate linked sample Jira tickets directly in that project (while an 18-node Project Chronos snapshot renders immediately in the meantime).
3. **Locate & Inspect Blockers:**
   - Click **`🎯 Focus Blocker`** in the top bar, pick an issue from the **Quick-Jump Issue Selector**, or press **`[` / `]`** to step through the Dependency Map.
   - Reorder any cockpit panel using the drag grip handle in its upper corner (click **`⇄ Reset Layout`** to restore defaults).
4. **Test Counterfactual Scenarios & Mitigations:**
   - Switch between **`📋 By Issue`** (pin multiple issues with `📌 Pin` for compound scenarios) and **`👤 By Person & Team`** in the unified **What-If Scenario Simulator** card.
   - Adjust **Schedule Change** or toggle **`+ Assign Extra Developer`**, **`✂ Decouple Dependency`**, and **`📦 Trim Scope (MVP)`**, then inspect **Projected Release Impact** (grey **Baseline** vs. blue/green/red **Simulated** bars) and the bottom tabs (**`Impacted`**, **`Blockers`**, **`Delivery Health`**, **`AI Action Plan`**).
5. **Scrub Future Finish Odds:** Drag the **Timeline & Sprint Forecast Scrubber** across sprint milestones and dates to inspect dynamic issue counts and **Delivery Confidence Distribution**.
6. **Test Rovo Chat:** Click **`✨ Ask @Rovo-World-Model Agent`** (or see [`ROVO_TEST_PROMPTS.md`](./ROVO_TEST_PROMPTS.md)) inside Jira Rovo Chat with `@Rovo-World-Model Agent`.

---

## 8. Build, Test & Forge Deployment

> **Prerequisites:** Node.js `22.x` LTS recommended (`nodejs22.x` Forge runtime) and `@forge/cli >= 13.3.0` (`14.2.0` verified with `rovo:skill` and `rovo:mcp`).

```bash
# 1. Install dependencies
npm install

# 2. Typecheck root TypeScript + bundle Custom UI (static/ui/build/)
npm run build

# 3. Run unit & regression test suite (32 tests)
npm test

# 4. Lint Forge manifest and Rovo skills
npx forge lint

# 5. Deploy to Forge development environment
npx forge deploy -e development
```

To install or upgrade on your Jira Cloud site after deployment:

```bash
npx forge install --upgrade -e development
```
