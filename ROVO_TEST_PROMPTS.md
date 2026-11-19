# Rovo Agent Test Prompts — `Rovo-World-Model Agent` (`rovo-world-model-agent`)

Use these 5 natural language prompts inside **Jira Rovo Chat** (`@Rovo-World-Model Agent`) on any live Jira project—or on the automatic Project Chronos snapshot if your test project has 0 issues—during live demos or Codegeist 2026 judging:

---

### Prompt 1: Counterfactual Delay Simulation & Goal Risk
> *"Simulate what happens to our release goal if our top bottleneck issue slips by 8 days."*

- **Triggered Rovo Action & Skill:** `simulate-delay-impact` (`delayDays: 8`, resolving the active project's top bottleneck or named Jira issue) + `causal-recovery-advisor`
- **What it demonstrates:** Runs 500 paired Twin-Network Common Random Numbers (CRN) Monte Carlo iterations and reports exact shifts across **Likely Finish (50% odds)**, **Target Commit Date (85% safe)**, and **Safe Buffer Date (95% cutoff)**, downstream blast-radius Jira keys, and **Teamwork Graph Goal** status transitions (`On Track` / `At Risk` / `Off Track`).

---

### Prompt 2: Recovery Mitigation Comparison (Brooks's Law vs. Decoupling vs. MVP Trim)
> *"If our top blocker slips by 8 days, compare adding +1 developer, decoupling blocking dependencies, and trimming non-essential scope to protect our Target Commit Date (85% safe)."*

- **Triggered Rovo Action & Skill:** `simulate-delay-impact` (`delayDays: 8` with `addDeveloper: true`, `decoupleBlockingEdges: true`, `trimScope: true`) + `causal-recovery-advisor`
- **What it demonstrates:** Compares the three recovery levers—**Brooks's Law** resource swarming (`addDeveloper`), API/interface decoupling (`decoupleBlockingEdges`), and **MVP scope triage** (`trimScope`)—in a side-by-side confidence date table.

---

### Prompt 3: Person Capacity, Unavailability & Compound Scenario Simulation
> *"What happens if Petri Paananen is unavailable for 5 days? Also test reassigning their parallel bottleneck and serializing concurrent work."*

- **Triggered Rovo Action & Skill:** `simulate-delay-impact` (`assigneeName`, `unavailableDays: 5`, `personMitigation: "reassign,serialize"`) + `causal-recovery-advisor`
- **What it demonstrates:** Exercises assignee-level capacity simulation across live Jira issues, exposing concurrent WIP overload and showing days recovered when rebalancing or serializing parallel work. Also supports multi-issue compound overrides via `compoundOverridesJson`.

---

### Prompt 4: Executive Sprint Review Critical Path & Earned Value Brief
> *"Analyze our critical path, Engineering Earned Value (CPI/SPI/EAC), 3-tier schedule buffers, and top 3 delivery bottlenecks."*

- **Triggered Rovo Action & Skill:** `analyze-critical-path` + `critical-path-executive-brief`
- **What it demonstrates:** Performs cycle-safe topological sorting and Monte Carlo float analysis to rank the **Top 3 Bottlenecks by Downstream Ripple Weight**, break down **Core Work Estimate / Team Risk Buffer / Executive Contingency**, report **CPI / SPI / EAC**, and inspect **Teamwork Graph Goals**.

---

### Prompt 5: Empty Project Onboarding — Populate Linked Sample Jira Issues
> *"Populate sample linked Jira issues into this project so we can explore multi-team causal dependencies."*

- **Triggered Rovo Action:** `seed-demo-scenario` (`populateJiraIssues: true`)
- **What it demonstrates:** Creates realistic linked multi-team sample Jira issues directly inside an empty live Jira Cloud project via the Jira REST API (or falls back to the 18-node Project Chronos synthetic causal snapshot if live creation is skipped).
