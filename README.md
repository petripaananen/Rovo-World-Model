# Rovo-World-Model

**Codegeist 2026 Hackathon Submission ("Build with context. Ship with confidence")**

- **Primary Category:** Apps for Software Teams
- **Bonus Categories Targeted:**
  1. **Best Agents — Rovo / Assignable Agents** (`rovo:agent`, 2 reusable `rovo:skill` playbooks, and 3 `action` tools)
  2. **Best App with Atlassian MCP** (Forge `rovo:mcp` server + JSON-RPC 2.0 `webtrigger` `mcp-world-model-endpoint`)
  3. **Best Apps with Teamwork Graph Integration** (Townsquare Goals & Confluence ADRs via `requestGraph` + Jira Teams & Issue Links)
  4. **Best Marketplace Published App** (Zero external server dependencies; 100% native Atlassian Forge `nodejs22.x`, least-privilege scopes)

---

## 1. Inspiration & Problem

Modern software delivery fails at the boundaries between teams. Traditional Jira boards and standard LLM text summaries are **correlational and static**—they can summarize what happened yesterday, but they cannot answer **counterfactual ($do$-calculus) questions** such as:
- *"What happens to our release goal if our top bottleneck issue slips by 8 days?"*
- *"Which 3 cross-team blockers on our critical path have the highest downstream blast radius right now?"*
- *"If a key engineer is out for 5 days, should we reassign a parallel bottleneck, serialize work, decouple an interface dependency, or trim non-essential scope (MVP) to protect our **Target Commit Date (85% safe)**?"*

To ship with confidence, engineering teams need a **Causal Project World Model (PWM)**—a live structural causal model (DAG) coupled with a paired **Twin-Network Monte Carlo simulator** that translates complex schedule distributions into clear delivery commitments (*Likely Finish (50% odds)*, *Target Commit Date (85% safe)*, *Safe Buffer Date (95% cutoff)*) and a transparent **3-Tier Schedule Buffer Breakdown** (*Core Work Estimate*, *Team Risk Buffer*, *Executive Contingency*).

---

## 2. What It Does

**Rovo-World-Model** unifies four capabilities into a single 100% native Atlassian Forge app:

1. **Causal DAG & Paired Monte Carlo Engine (`src/engine/`):**
   - Constructs a cycle-safe Directed Acyclic Graph (DAG) from live Jira issues and `issuelinks`, supporting all 4 precedence types (`FS`, `SS`, `FF`, `SF`) + lead/lag days, 3-point PERT Beta estimation, and discrete Bernoulli risk shocks.
   - Uses three-color DFS to automatically detect and break circular dependencies in live Jira data without crashing.
   - Runs **500-iteration Common Random Numbers (CRN) Twin-Network Monte Carlo simulations** in `< 15ms`, alongside **Brooks's Law** communication/ramp-up physics, person-level WIP contention modeling, and **Hierarchical Engineering Earned Value (`CPI`, `SPI`, `EAC`)**.

2. **Customizable Drag & Drop Custom UI Cockpit (`static/ui/`):**
   - **Top App Bar:** Live Jira Project Switcher (`#jira-project-select`), simulation telemetry pill (`500 runs · X ms`), `↻ Sync Jira Project`, conditional **`+ Add Sample Issues`** (shown automatically when inspecting an empty or synthetic project), `🎯 Focus Blocker (<key>)`, `⇄ Reset Layout`, and `Reset`.
   - **Drag & Drop Panel Arrangement:** Each primary panel (**Project Status**, **Issue Dependency Map**, **Timeline & Sprint Forecast Scrubber**, and **What-If Scenario Simulator**) features a top-corner drag handle (`data-drag-panel`) to reorder panels with persisted layout state.
   - **Left Executive Command Rail:** 4 high-contrast SVG arch gauges (*On-Time Probability*, *Forecast Spread / Schedule Slip*, *Blocker Float*, *Target Commit*) + hierarchical **Jira Teamwork Graph Goals** status.
   - **Center Stage — 4-Shape Pre-Attentive Issue Dependency Map & Timeline Scrubber:**
     - Real Jira Team swimlanes (via Jira `Team` field or `team:` labels), **`● Circle`** (Task / Epic with Sub-task completion ring), **`⬢ Hexagon`** (Critical Path Blocker), **`◆ Diamond`** (Stage Gate / ADR), and **`▬ Stadium Pill`** (Teamwork Graph Goal).
     - Interactive **Quick-Jump Issue Selector**, `[` / `]` keyboard stepping, and hover cards displaying explicit **`Blocked by:`** and **`Blocks:`** lineage.
     - **Timeline & Sprint Forecast Scrubber:** 6 sprint milestone buttons, continuous date slider with live finish-odds badge, **3-Tier Schedule Buffer Breakdown**, and **Delivery Confidence Distribution** histogram.
   - **Right Column — Dual-Mode Multi-Task & Person What-If Simulator:**
     - Switch seamlessly between **`📋 By Issue`** (with multi-issue pinning via `📌 Pin` and stacked compound overrides) and **`👤 By Person & Team`** (unavailability `-3d to +15d` plus `⇄ Reassign Bottleneck`, `🧹 Serialize Parallel Work`, and `🤝 Pair on Top Blocker`).
     - **1. Schedule Change (`-5d` to `+30d`)** and **2. Recovery Mitigations** (`+ Assign Extra Developer`, `✂ Decouple Dependency`, `📦 Trim Scope (MVP)`).
     - **Projected Release Impact** comparison bars, **`✨ Ask @Rovo-World-Model Agent`** prompt builder, and 4 inspector tabs (`Impacted`, `Blockers`, `Delivery Health`, `AI Action Plan`).

3. **Rovo-World-Model Agent, Actions & Reusable Skills (`manifest.yml`, `skills/`, `src/rovo/actions.ts`):**
   - Conversational co-pilot (`rovo-world-model-agent` with custom SVG icon) equipped with 3 `action` tools (`simulate-delay-impact`, `analyze-critical-path`, `seed-demo-scenario`) and 2 reusable `rovo:skill` modules (`causal-recovery-advisor`, `critical-path-executive-brief`) that other Rovo Studio agents can reuse.

4. **Dual Atlassian MCP Server (`rovo:mcp` + Webtrigger JSON-RPC 2.0 in `src/mcp/server.ts`):**
   - Official Forge `rovo:mcp` module (`rovo-world-model-mcp`) exposing `simulate-delay-impact`, `analyze-critical-path`, and `seed-demo-scenario` to Rovo Studio and connected MCP clients.
   - Dedicated Forge `webtrigger` JSON-RPC 2.0 server (`mcp-world-model-endpoint`) exposing `pwm_simulate_intervention`, `pwm_get_critical_path`, `pwm_simulate_delay_impact`, `pwm_analyze_critical_path`, `pwm_seed_demo_scenario`, and `pwm_get_causal_graph` (with `X-PWM-Confirm-Write: true` safety guard for Jira writes).

---

## 3. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Atlassian Cloud & Teamwork Graph (TWG)                   │
│         Jira Issues (Blocks / Depends on)  •  Teams  •  TWG Goals          │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │ Jira REST v3 & TWG GraphQL         │ 0-issue fallback / seeder
                    ▼                                    ▼
┌────────────────────────────────────────┐  ┌────────────────────────────────┐
│   Live Extractor (`src/twg/graphFetcher`)│  │  Zero-Config Fallback & Seeder │
│  • Three-Color DFS Cycle Auto-Breaker  │  │  "Project Chronos" (18 Nodes)  │
│  • Deterministic Kahn Topological Sort │  │  +1-Click Add Sample Issues    │
└───────────────────┬────────────────────┘  └────────────┬───────────────────┘
                    └───────────────────┬────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│     Causal Monte Carlo & do-Calculus Engine (`src/engine/simulator.ts`)    │
│  • 500-Iteration Twin-Network Common Random Numbers (CRN) (< 15ms)         │
│  • Levers: Issue Shifts, +1 Dev (Brooks), Decouple, Trim MVP, Person WIP   │
│  • Outputs: 50%/85%/95% Confidence, 3-Tier Buffers, EVM, Goal Risk         │
└─────────┬─────────────────────────────┬────────────────────────────┬───────┘
          ▼                             ▼                            ▼
┌──────────────────────┐   ┌─────────────────────────┐   ┌───────────────────┐
│  Custom UI Cockpit   │   │  Rovo Agent + Skills    │   │  MCP Server       │
│  (`jira:projectPage`)│   │  (`rovo:agent`/`skill`) │   │  (`rovo:mcp` +    │
│  Drag & Drop Panels  │   │  + 3 `action` Modules   │   │   JSON-RPC 2.0)   │
└──────────────────────┘   └─────────────────────────┘   └───────────────────┘
```

---

## 4. Judge Quick-Start Instructions (< 2 Minutes)

1. **Open any Jira Project** and click **Rovo-World-Model** in the left project sidebar (or switch projects from the header dropdown and click **`↻ Sync Jira Project`**).
2. **Zero-Config Ready:** Live Jira issues, sub-tasks, assignees, estimates, and dependency links are loaded automatically. If a test Jira project has 0 issues, click **`+ Add Sample Issues`** in the header to create linked sample Jira tickets directly in that project (while an 18-node Project Chronos snapshot renders immediately in the meantime).
3. **Locate & Inspect Blockers:**
   - Click **`🎯 Focus Blocker`** in the top bar, pick an issue from the **Quick-Jump Issue Selector**, or press **`[` / `]`** to step through the Dependency Map.
   - Reorder any cockpit panel using the drag grip handle in its upper corner (click **`⇄ Reset Layout`** to restore defaults).
4. **Test Counterfactual Scenarios & Mitigations:**
   - Switch between **`📋 By Issue`** (pin multiple issues with `📌 Pin` for compound scenarios) and **`👤 By Person & Team`** in **What-If Scenario Simulator**.
   - Adjust **Schedule Change** or toggle **`+ Assign Extra Developer`**, **`✂ Decouple Dependency`**, and **`📦 Trim Scope (MVP)`** to compare impacts on *Likely Finish (50%)*, *Target Commit Date (85%)*, and *Safe Buffer Date (95%)*.
5. **Scrub Future Finish Odds:** Drag the **Timeline & Sprint Forecast Scrubber** across sprint milestones and dates to inspect dynamic issue counts and **Delivery Confidence Distribution**.
6. **Test Rovo Chat:** Click **`✨ Ask @Rovo-World-Model Agent`** (or use [`ROVO_TEST_PROMPTS.md`](file:///c:/Users/petri/.gemini/antigravity/Rovo-world-model/ROVO_TEST_PROMPTS.md)) inside Jira Rovo Chat with `@Rovo-World-Model Agent`.
