# Rovo Agent Test Prompts — Rovo-World-Model Agent (`rovo-world-model-agent`)

Use these 5 natural language prompts inside **Jira Rovo Chat** (`@Rovo-World-Model Agent`) during live demos, user testing, or the Codegeist 2026 judging walkthrough:

---

### Prompt 1: Counterfactual Delay Simulation on High-Level Goal
> *"Simulate what happens to our Q4 Global Launch goal if CORE-104 is delayed by 10 days."*

- **Triggered Rovo Action:** `simulate-delay-impact` (`issueKey: "CORE-104"`, `delayDays: 10`)
- **What it demonstrates:** Resolves `CORE-104` / `CHRON-104` (*Distributed State Snapshot & WAL Sync Protocol*), runs 500 paired Twin-Network Common Random Numbers (CRN) Monte Carlo iterations in `< 15ms`, and reports exact shifts across **Likely Finish (50% odds)**, **Target Commit Date (85% safe)**, and **Safe Buffer Date (95% cutoff)**, downstream blast-radius tasks across *Core Engine*, *Cloud Infra*, and *Client UI*, and the impact on **Q4 Global Launch** and **Zero-Downtime Migration** goals.

---

### Prompt 2: Critical Path & Downstream Blast Radius Ranking
> *"Which 3 issues on our critical path have the highest causal blast radius right now?"*

- **Triggered Rovo Action:** `analyze-critical-path`
- **What it demonstrates:** Performs cycle-safe topological sorting and forward/backward pass float analysis to return the **Top 3 Bottleneck Nodes ranked by Downstream Ripple Weight** (`CHRON-104`, `CHRON-108`, `CHRON-109`), including criticality index (%), schedule leverage, Engineering Earned Value (`CPI`, `SPI`, `EAC`), and mitigation recommendations.

---

### Prompt 3: Target-Date Confidence & Recovery Mitigation Strategy
> *"If we want to protect our November 30 Target Commit Date (85% safe), should we assign an extra developer, decouple a blocking dependency, or trim non-essential scope on CORE-104?"*

- **Triggered Rovo Action:** `analyze-critical-path` + `simulate-delay-impact`
- **What it demonstrates:** Compares the three core recovery levers—**Brooks's Law resource swarming** (`addDeveloper`), **interface decoupling** (`decoupleBlockingEdges`), and **MVP scope triage** (`trimScope`)—and identifies `CHRON-104 -> CHRON-109` between *Core Engine* and *Cloud Infra* as the highest-leverage bottleneck.

---

### Prompt 4: One-Command Demo Seeding & Cross-Team Bottleneck Analysis
> *"Seed the Project Chronos demo scenario and analyze cross-team bottlenecks between Core Engine and Cloud Infra."*

- **Triggered Rovo Action:** `seed-demo-scenario` + `analyze-critical-path`
- **What it demonstrates:** Initializes the 18-node **Project Chronos: Next-Gen Platform Launch** causal graph (`isSyntheticDemo: true`) in Forge storage and analyzes the cross-team handoffs between *Core Engine* (`CHRON-101..106`), *Cloud Infra* (`CHRON-107..112`), and *Client UI* (`CHRON-113..118`).

---

### Prompt 5: Executive Sprint Review Risk & Schedule Buffer Summary
> *"Generate an executive risk summary for our sprint review showing our Core Work Estimate, Team Risk Buffer, Executive Contingency, and Goal status."*

- **Triggered Rovo Action:** `analyze-critical-path`
- **What it demonstrates:** Synthesizes **Likely Finish (50% odds)**, **Target Commit Date (85% safe)**, and **Safe Buffer Date (95% cutoff)** alongside the 3-tier buffer breakdown (*Core Work Estimate*, *Team Risk Buffer*, *Executive Contingency*), **Teamwork Graph Goal** status (**Zero-Downtime Migration** & **Q4 Global Launch**), Earned Value health (`CPI`/`SPI`), and prioritized de-risking actions.
