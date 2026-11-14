# Rovo-World-Model

**Codegeist 2026 Hackathon Submission ("Build with context. Ship with confidence")**

- **Primary Category:** Apps for Software Teams
- **Bonus Categories Targeted:**
  1. **Best Agents — Rovo / Assignable Agents** (`rovo:agent` + 3 `action` tools)
  2. **Best App with Atlassian MCP** (`mcp-world-model-endpoint` JSON-RPC 2.0 Webtrigger)
  3. **Best Apps with Teamwork Graph Integration** (Goals + Teams + Jira Issue Links + Confluence ADRs)
  4. **Best Marketplace Published App** (Zero external server dependencies; 100% native Atlassian Forge `nodejs22.x`)

---

## 1. Inspiration & Problem

Modern software delivery fails at the boundaries between teams. Traditional Jira boards and standard LLM text summaries are **correlational and static**—they can summarize what happened yesterday, but they cannot answer **counterfactual ($do$-calculus) questions** such as:
- *"What happens to our release goal if `CHRON-104` / `KAN-3` slips by 10 days?"*
- *"Which 3 cross-team blockers on our critical path have the highest downstream blast radius right now?"*
- *"If we assign an extra developer (accounting for Brooks's Law ramp-up drag), decouple a blocking dependency, or trim non-essential scope (MVP), can we recover our **Target Commit Date (85% safe)**?"*

To ship with confidence, engineering leaders need a **Causal Project World Model (PWM)**—a live structural causal model (DAG) coupled with a paired **Twin-Network Monte Carlo simulator** that translates complex schedule probability distributions into clear delivery commitments (*Likely Finish (50% odds)*, *Target Commit Date (85% safe)*, *Safe Buffer Date (95% cutoff)*) and a transparent **3-Tier Schedule Buffer Breakdown** (*Core Work Estimate*, *Team Risk Buffer*, *Executive Contingency*).

---

## 2. What It Does

**Rovo-World-Model** unifies four capabilities into a single 100% native Atlassian Forge app:

1. **Causal DAG & Paired Monte Carlo Engine (`src/engine/`):**
   - Constructs a cycle-safe Directed Acyclic Graph (DAG) from live Jira issues and `issuelinks`, supporting all 4 precedence types (`FS`, `SS`, `FF`, `SF`) + lead/lag days, 3-point PERT Beta estimation, and discrete Bernoulli risk shocks.
   - Uses three-color DFS to automatically detect and break circular dependencies in messy Jira data without crashing.
   - Runs **500-iteration Common Random Numbers (CRN) Twin-Network Monte Carlo simulations** in `< 15ms`, alongside **Brooks's Law** communication/ramp-up physics ($N = n(n-1)/2$) and **Hierarchical Engineering Earned Value (`CPI`, `SPI`, `EAC`)**.

2. **3-Column Custom UI Cockpit (`static/ui/`):**
   - **Top App Bar:** Live Jira Project Switcher (`#jira-project-select`), simulation telemetry pill (`500 runs · X ms`), `↻ Sync Jira Project`, `🎯 Focus Blocker (<key>)`, and `Reset`.
   - **Left Executive Command Rail:** 4 high-contrast SVG arch gauges (*On-Time Probability*, *Forecast Spread / Schedule Slip*, *Blocker Float*, *Target Commit*) + hierarchical **Jira Teamwork Graph Goals** tree.
   - **Center Stage — 4-Shape Pre-Attentive Issue Dependency Map & Timeline Scrubber:**
     - Real Jira Team swimlanes (via the Jira `Team` field or `team:<Name>` labels, or a unified `No Team Assigned` swimlane when no teams are configured), **`● Circle`** (Task / Epic with Sub-task completion ring), **`⬢ Hexagon`** (Critical Path Blocker), **`◆ Diamond`** (Stage Gate / ADR), and **`▬ Stadium Pill`** (Teamwork Graph Goal).
     - Interactive **Quick-Jump Issue Selector** (`#dag-issue-jump-select`), `[` and `]` keyboard stepping, and hover cards displaying explicit **`Blocked by:`** and **`Blocks:`** lineage.
     - **Timeline & Sprint Forecast Scrubber:** 6 sprint milestone buttons (`Sprint -2`, `Sprint -1`, `Today (Current)`, `Likely Finish`, `Target Commit Date`, `Safe Buffer Date`), continuous date slider with live **`XX% FINISH ODDS`** target-date confidence badge, **3-Tier Schedule Buffer Breakdown**, and **Delivery Confidence Distribution** histogram.
   - **Right Column — What-If Scenario Simulator & Inspector Tabs:**
     - Selected Issue card showing Sub-tasks / Epic Progress, Uncertainty, Criticality %, and `Blocked by` / `Blocks` lineage.
     - **1. Schedule Change (`-5d` to `+30d`)** slider + presets and **2. Recovery Mitigations** triad: **`+ Assign Extra Developer`** (with Brooks's Law ramp-up calibration), **`✂ Decouple Dependency`**, and **`📦 Trim Scope (MVP)`**.
     - **Projected Release Impact** comparison bars (*Likely Finish (50% odds)*, *Target Commit Date (85% safe)*, *Safe Buffer Date (95% cutoff)*), **`✨ Ask @Rovo-World-Model Agent`** button, and 4 inspector tabs (`Impacted`, `Blockers`, `Delivery Health`, `AI Action Plan`).

3. **Rovo-World-Model Agent (`src/rovo/actions.ts`):**
   - Conversational co-pilot (`rovo-world-model-agent`) equipped with three reusable `action` tools: `simulate-delay-impact`, `analyze-critical-path`, and `seed-demo-scenario`.

4. **Atlassian MCP Server (`src/mcp/server.ts`):**
   - JSON-RPC 2.0 webtrigger endpoint (`mcp-world-model-endpoint`) exposing `pwm_simulate_intervention`, `pwm_get_critical_path`, `pwm_simulate_delay_impact`, `pwm_analyze_critical_path`, `pwm_seed_demo_scenario`, and `pwm_get_causal_graph`.

---

## 3. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Atlassian Cloud & Teamwork Graph (TWG)                   │
│         Jira Issues (Blocks / Depends on)  •  Teams  •  TWG Goals          │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │ Jira REST v3 & TWG context         │ < 5 issues auto-fallback
                    ▼                                    ▼
┌────────────────────────────────────────┐  ┌────────────────────────────────┐
│   Live Extractor (`src/twg/graphFetcher`)│  │  Zero-Config DemoFallback       │
│  • Three-Color DFS Cycle Auto-Breaker  │  │  "Project Chronos" (18 Nodes,  │
│  • Deterministic Kahn Topological Sort │  │   Core Engine / Cloud Infra /  │
└───────────────────┬────────────────────┘  │   Client UI • 2 TWG Goals)     │
                    └───────────────────┬───┴────────────────────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│     Causal Monte Carlo & do-Calculus Engine (`src/engine/simulator.ts`)    │
│  • 500-Iteration Twin-Network Common Random Numbers (CRN) (< 15ms)         │
│  • Levers: Slip/Accel (-5d..+30d), +1 Dev (Brooks), Decouple, Trim Scope   │
│  • Outputs: 50%/85%/95% Confidence, 3-Tier Buffers, EVM, Goal Risk         │
└─────────┬─────────────────────────────┬────────────────────────────┬───────┘
          ▼                             ▼                            ▼
┌──────────────────────┐   ┌─────────────────────────┐   ┌───────────────────┐
│  Custom UI Cockpit   │   │  Rovo Agent & Actions   │   │  MCP JSON-RPC 2.0 │
│  (`jira:projectPage`)│   │  (`rovo:agent`/`action`)│   │  Forge Webtrigger │
└──────────────────────┘   └─────────────────────────┘   └───────────────────┘
```

---

## 4. Judge Quick-Start Instructions (< 2 Minutes)

1. **Open any Jira Project** and click **Rovo-World-Model** in the left project sidebar (or switch live projects from the top-left **Spaces** dropdown and click **`↻ Sync Jira Project`**).
2. **Zero-Config Ready:** Live Jira issues, assignees, story points/time estimates, sub-task progress, and dependency links are loaded automatically. If a test Jira project has fewer than 5 issues, **Project Chronos** loads automatically so judges can immediately explore a multi-team causal graph.
3. **Locate & Inspect Blockers:**
   - Click **`🎯 Focus Blocker`** in the top bar, pick any issue from the **Quick-Jump Issue Selector** (`#dag-issue-jump-select`), or press **`[` / `]`** on your keyboard to step through the Dependency Map.
   - Hover any node to inspect its **Projected Finish**, **Deadline Float**, **`Blocked by:`**, and **`Blocks:`** lineage.
4. **Test Counterfactual Scenarios & Mitigations:**
   - Drag the **`1. Schedule Change (-5d to +30d)`** slider to inject a hypothetical slip and watch red causal ripples propagate to downstream tickets and **Jira Teamwork Graph Goals**.
   - Toggle **`+ Assign Extra Developer`**, **`✂ Decouple Dependency`**, or **`📦 Trim Scope (MVP)`** in **`2. Recovery Mitigations`** to measure recovered days across *Likely Finish (50%)*, *Target Commit Date (85%)*, and *Safe Buffer Date (95%)*.
5. **Scrub Future Finish Odds:** Drag the **Timeline & Sprint Forecast Scrubber** across past sprints and future dates to view dynamic issue status counts (`DONE`, `IN PROGRESS`, `AT RISK`, `TO DO`) alongside the live **`XX% FINISH ODDS`** badge and **Delivery Confidence Distribution**.
6. **Test Rovo Chat:** Click **`✨ Ask @Rovo-World-Model Agent`** (or see [`ROVO_TEST_PROMPTS.md`](file:///c:/Users/petri/.gemini/antigravity/Rovo-world-model/ROVO_TEST_PROMPTS.md)) and paste into Jira Rovo Chat with `@Rovo-World-Model Agent`.
