# STEP 4: BUILD THE CUSTOM UI COCKPIT (`static/ui/`)

Now that the backend resolvers, PWM causal engine, and Rovo/MCP handlers are ready, execute **Step 4** to build a polished, executive-grade Custom UI inside `static/ui/`.

## Objectives
Build the **Jira Time Machine & Causal World Model Cockpit** (`static/ui/`) using React, TypeScript, and Tailwind CSS (or clean modern CSS modules) that communicates with our Forge backend via `@forge/bridge` (`invoke`).
Note: Ensure the UI also has a local mock fallback if `invoke` fails during local browser development.

## Core UI Components to Build

### 1. Header Bar & Judge Controls (`src/components/HeaderBar.tsx`)
- App title: **Rovo World Model — Causal Time Machine**
- Active data badge: Shows `"Live Jira + TWG Data"` or `"Demo Scenario: Project Chronos (18 Nodes)"`.
- **"Load Demo Scenario" Button:** One-click button that triggers `invoke('loadDemoScenario')` so judges can test immediately.
- **KPI Summary Pills:**
  - Baseline P85 Completion Date vs. Simulated P85 Date (with $\Delta$ days badge in red/green).
  - Active Critical Bottlenecks count.
  - Affected Teamwork Graph Goals count.

### 2. Interactive Causal DAG Canvas (`src/components/DagCanvas.tsx`)
- Render an interactive left-to-right Directed Acyclic Graph (SVG + HTML overlay) grouped by Team / Stage.
- Color-code nodes:
  - **Critical Path Nodes:** Highlighted with an amber/crimson border.
  - **Selected / Intervened Node:** Glowing cyan/blue indicator (`do(Delay = +X days)`).
  - **Downstream Blast Radius Nodes:** Pulsing orange/red badge showing exact propagated delay (`+X.X days`).
- Clicking any node opens it in the **Scenario Intervention Panel**.

### 3. Time Machine Scrubber (`src/components/TimelineScrubber.tsx`)
- A horizontal timeline slider spanning **Past Sprints -> Today (State $t_0$) -> Future Probability Cones (P50, P85, P95)**.
- Dragging the scrubber forward in time dynamically highlights which nodes are expected to be *Done*, *In Progress*, or *At Risk / Blocked* on that specific future date.

### 4. Counterfactual Intervention Panel (`src/components/ScenarioPanel.tsx`)
- Displays details of the currently selected node (Key, Summary, Team, Linked Goal, Base Estimate, Uncertainty $\sigma$).
- **"What-If" Intervention Controls ($do$-calculus):**
  - **Delay / Accelerate Slider:** `-5 days` to `+30 days` (triggers instant `runWhatIfSimulation` calculation).
  - **Scope / Resource Toggle:** Simulate adding a developer or decoupling a blocking edge.
- **Causal Impact Readout:**
  - Shows a side-by-side comparison of Baseline vs. Counterfactual P50 / P85 / P95 completion distribution bars.
  - Lists the top downstream affected tickets and a **"Copy Rovo Mitigation Prompt"** button.

## Final Verification
1. Ensure `static/ui/package.json` builds cleanly into `static/ui/build` (matching `manifest.yml` resource path).
2. Run `npm install` and `npm run build` inside `static/ui/` and verify zero build errors.
