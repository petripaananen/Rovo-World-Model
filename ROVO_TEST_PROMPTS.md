# Rovo Agent Test Prompts — Causal Time Machine Agent (`pwm-time-machine-agent`)

Use these 5 high-impact natural language prompts inside **Jira Rovo Chat** (`@Causal Time Machine Agent`) during live demos or the Codegeist 2026 judging video:

---

### Prompt 1: Counterfactual Delay Simulation on High-Level Goal
> *"Simulate what happens to our Q4 Global Launch goal if CORE-104 is delayed by 10 days."*

- **Triggered Rovo Action:** `simulate-delay-impact` (`issueKey: "CORE-104"`, `delayDays: 10`)
- **What it demonstrates:** Resolves `CORE-104` / `CHRON-104` (*Distributed State Snapshot & WAL Sync Protocol*), runs 500 paired Twin-Network Common Random Numbers (CRN) Monte Carlo iterations in `< 10ms`, and reports exact P50/P85/P95 date shifts, downstream blast-radius tasks across *Core Engine*, *Cloud Infra*, and *Client UI*, and the impact on **Q4 Global Launch** and **Zero-Downtime Migration** goals.

---

### Prompt 2: Critical Path & Downstream Blast Radius Ranking
> *"Which 3 issues on our critical path have the highest causal blast radius right now?"*

- **Triggered Rovo Action:** `analyze-critical-path`
- **What it demonstrates:** Performs cycle-safe topological sorting and forward/backward pass float analysis to return the **Top 3 Bottleneck Nodes ranked by Downstream Ripple Weight** (`CHRON-104`, `CHRON-108`, `CHRON-109`), including criticality index (%) and mitigation steps.

---

### Prompt 3: Target-Date Confidence & Dependency Decoupling Strategy
> *"If we want to ship by November 30 with 85% confidence (P85), which dependency should we decouple?"*

- **Triggered Rovo Action:** `analyze-critical-path` + `simulate-delay-impact`
- **What it demonstrates:** Identifies the cross-team `Architectural Decision` / `Blocks` edge `CHRON-104 -> CHRON-109` between *Core Engine* and *Cloud Infra* as the highest-leverage decoupling point to compress the P85 commit date.

---

### Prompt 4: One-Command Judge Demo Seeding & Cross-Team Bottleneck Analysis
> *"Seed the Project Chronos demo scenario and analyze cross-team bottlenecks between Core Engine and Cloud Infra."*

- **Triggered Rovo Action:** `seed-demo-scenario` + `analyze-critical-path`
- **What it demonstrates:** Initializes the 18-node **Project Chronos: Next-Gen Platform Launch** causal graph (`isSyntheticDemo: true`) in Forge storage and analyzes the handoffs between *Core Engine* (`CHRON-101..106`), *Cloud Infra* (`CHRON-107..112`), and *Client UI* (`CHRON-113..118`).

---

### Prompt 5: Executive Sprint Review Risk Summary
> *"Generate an executive risk summary for our sprint review based on the current world model."*

- **Triggered Rovo Action:** `analyze-critical-path`
- **What it demonstrates:** Synthesizes P50/P85/P95 completion cones, Teamwork Graph Goal alignment (**Zero-Downtime Migration** & **Q4 Global Launch**), active blocked tasks (`CHRON-109`), and concrete resource-swarming recommendations.

