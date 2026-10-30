# Rovo-World-Model

**Codegeist 2026 Hackathon Submission ("Build with context. Ship with confidence")**

- **Primary Category:** Apps for Software Teams
- **Bonus Categories Targeted:**
  1. **Best Agents — Rovo / Assignable Agents** (`rovo:agent` + 3 `action` tools)
  2. **Best App with Atlassian MCP** (`mcp-world-model-endpoint` JSON-RPC 2.0 Webtrigger)
  3. **Best Apps with Teamwork Graph Integration** (Townsquare Goals + Teams + Jira Issue Links + Confluence ADRs)
  4. **Best Marketplace Published App** (Zero external server dependencies; 100% native Atlassian Forge `nodejs22.x`)

---

## 1. Inspiration & Problem

Modern software delivery fails at the boundaries between teams. Traditional Jira boards and standard LLM text summaries are **correlational and static**—they can summarize what happened yesterday, but they cannot answer **counterfactual ($do$-calculus) questions** such as:
- *"What happens to our **Q4 Global Launch** goal if `CORE-104` slips by 10 days?"*
- *"Which 3 cross-team dependencies on our critical path have the highest downstream blast radius right now?"*
- *"If we add a swarm developer or decouple a blocking architecture gate, can we recover our P85 commitment date?"*

To ship with confidence, engineering leaders need a **Causal Project World Model (PWM)**—a live structural causal model (DAG) coupled with a paired **Twin-Network Monte Carlo simulator** that propagates schedule shocks across issues, teams, and Atlassian Teamwork Graph Goals in milliseconds.

---

## 2. What It Does

**Rovo World Model — Causal Time Machine** unifies four capabilities into a single Atlassian Forge app:
1. **Project World Model (PWM) Engine (`src/engine/`):**
   - Constructs a cycle-safe Directed Acyclic Graph (DAG) from live Jira issues and `issuelinks` (`Blocks`, `Depends on`, `Architectural Decision`).
   - Uses three-color DFS to automatically detect and break circular dependencies in dirty Jira data without crashing.
   - Runs **500-iteration Common Random Numbers (CRN) Twin-Network Monte Carlo simulations** in `< 10ms` to forecast **P50 (Median)**, **P85 (Commit)**, and **P95 (Tail-Risk)** completion dates.
2. **Jira Time Machine Custom UI Cockpit (`static/ui/`):**
   - **Header Bar & Judge Controls:** Displays active data mode (`"Live Jira + TWG Data"` vs. `"Demo Scenario: Project Chronos (18 Nodes)"`), KPI summary pills, and 1-click **"Load Demo Scenario"** and **"Create Real Jira Issues"** buttons.
   - **Time Machine Scrubber:** Scrub from **Past Sprints (`-28d`) $\to$ Today (`State t₀`) $\to$ Future Probability Cones (`P50, P85, P95`)** to dynamically highlight which nodes are *Done*, *In Progress*, or *At Risk / Blocked* on any date.
   - **Interactive Causal DAG Canvas:** Multi-swimlane SVG graph across *Core Engine*, *Cloud Infra*, and *Client UI* with glowing critical-path borders and animated blast-radius edges.
   - **Scenario Intervention Panel ($do$-calculus):** Slide **Delay / Accelerate (`-5d` to `+30d`)**, toggle **Add Developer (+1 Resource)** or **Decouple Blocking Edge**, compare side-by-side Baseline vs. Counterfactual P50/P85/P95 bars, and click **"Copy Rovo Mitigation Prompt"**.
3. **Rovo-World-Model Agent (`src/rovo/actions.ts`):**
   - Conversational co-pilot (`rovo-world-model-agent`) equipped with three actions: `simulate-delay-impact`, `analyze-critical-path`, and `seed-demo-scenario`.
4. **Atlassian Model Context Protocol (MCP) Server (`src/mcp/server.ts`):**
   - JSON-RPC 2.0 webtrigger endpoint (`mcp-world-model-endpoint`) exposing `pwm_simulate_intervention`, `pwm_get_critical_path`, `pwm_seed_demo_scenario`, and `pwm_get_causal_graph`.

---

## 3. How We Built It

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Atlassian Cloud & Teamwork Graph (TWG)                   │
│         Jira Issues (Blocks / Depends on)  •  Teams  •  TWG Goals          │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │ Jira REST v3 & TWG GraphQL         │ < 5 issues auto-fallback
                    ▼                                    ▼
┌────────────────────────────────────────┐  ┌────────────────────────────────┐
│   Live Extractor (`src/twg/graphFetcher`)│  │  Judge-Ready Synthetic Seeder  │
│  • Three-Color DFS Cycle Auto-Breaker  │  │  "Project Chronos" (18 Nodes,  │
│  • Deterministic Kahn Topological Sort │  │   Core Engine / Cloud Infra /  │
└───────────────────┬────────────────────┘  │   Client UI • 2 TWG Goals)     │
                    └───────────────────┬───┴────────────────────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│        Causal Monte Carlo & $do$-Calculus Engine (`src/engine/simulator`)  │
│  • 500-Iteration Twin-Network Common Random Numbers (CRN) (< 10ms runtime) │
│  • Interventions: Delay/Accelerate (-5d..+30d), +1 Dev, Decouple Edge      │
│  • Outputs: P50 / P85 / P95 Cones, Blast Radius, Goal Risk, Bottlenecks    │
└─────────┬─────────────────────────────┬────────────────────────────┬───────┘
          ▼                             ▼                            ▼
┌──────────────────────┐   ┌─────────────────────────┐   ┌───────────────────┐
│  Jira Time Machine   │   │  Causal Time Machine    │   │  MCP JSON-RPC 2.0 │
│  Custom UI Cockpit   │   │  Rovo Agent & 3 Actions │   │  Forge Webtrigger │
│ (`jira:projectPage`) │   │ (`rovo:agent`/`action`) │   │ (`webtrigger`)    │
└──────────────────────┘   └─────────────────────────┘   └───────────────────┘
```

---

## 4. Judge Quick-Start Instructions (< 2 Minutes)

1. **Open any Jira Project** and click **Rovo-World-Model** in the left project sidebar.
2. **Zero-Setup Demo Mode:** If your test Jira instance has fewer than 5 issues, the app automatically loads **"Project Chronos: Next-Gen Platform Launch"** (18 interconnected nodes across *Core Engine*, *Cloud Infra*, and *Client UI*, linked to **Zero-Downtime Migration** and **Q4 Global Launch** goals). You can also click **⚡ Load Demo Scenario** or **➕ Create Real Jira Issues** in the header at any time.
3. **Explore Counterfactuals ($do$-calculus):**
   - Click bottleneck node **`CHRON-104`** on the DAG canvas.
   - Drag the **Delay / Accelerate Slider (`-5d` to `+30d`)** in the right panel and watch the red causal ripple propagate across downstream tickets and Teamwork Graph Goals in real time.
   - Toggle **👩‍💻 Add Developer (+1 Resource)** or **✂️ Decouple Blocking Edge** to see how much schedule buffer is recovered on the side-by-side P50 / P85 / P95 distribution bars.
4. **Scrub the Time Machine:** Drag the **Time Machine Scrubber** from `Past (-28d)` through `Today (State t₀)` to `Future Cone P95` to see which issues are *Done*, *In Progress*, or *At Risk / Blocked* on any future date.
5. **Test Rovo Chat:** Click **📋 Copy Rovo Mitigation Prompt** (or see [`ROVO_TEST_PROMPTS.md`](file:///c:/Users/petri/.gemini/antigravity/Rovo-world-model/ROVO_TEST_PROMPTS.md)) and paste into Rovo Chat with `@Rovo-World-Model Agent`.
