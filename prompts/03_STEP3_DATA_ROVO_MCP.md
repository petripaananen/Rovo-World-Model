# STEP 3: BUILD DATA FETCHERS, TEAMWORK GRAPH & ROVO HANDLERS

Now that **Step 1 (`manifest.yml`)** and **Step 2 (`src/engine/`)** are complete, execute **Step 3**.

## Objectives
Implement the integration layer connecting Jira / Atlassian Teamwork Graph (TWG), the Causal PWM Engine, Rovo Agent Actions, and the MCP Webtrigger endpoint.

## Tasks to Execute

### 1. `src/twg/syntheticSeeder.ts` (Judge-Ready Fallback & Seeder)
- Create a rich, realistic default dataset called **"Project Chronos: Next-Gen Platform Launch"** containing **18 interconnected nodes** across 3 teams (*Core Engine*, *Cloud Infra*, *Client UI*) and 2 high-level Atlassian Goals (*Q4 Global Launch*, *Zero-Downtime Migration*).
- Include realistic `baseEstimateDays`, `uncertaintySigma`, `status`, and cross-team `CausalEdge` dependencies (`Blocks`, `Depends on`, `Architectural Decision`).
- Also provide an optional helper `seedJiraProject(projectKey)` that uses `api.asApp().requestJira(route`/rest/api/3/issue`)` to create real demo issues if the user clicks "Create Real Jira Issues".

### 2. `src/twg/graphFetcher.ts` (Jira + Teamwork Graph Extractor)
- Query active Jira project issues and `issueLinks` via `api.asApp().requestJira(route`/rest/api/3/search?jql=project=${projectKey}&fields=summary,status,issuelinks,assignee,timetracking,duedate`)`.
- Query Teamwork Graph / GraphQL context (or enrich nodes with Goal/Team metadata).
- Map the fetched issues and links directly into our `CausalNode[]` and `CausalEdge[]` structures.
- **Auto-Fallback:** If the current Jira project has fewer than 5 issues, automatically return the `"Project Chronos"` synthetic graph (flagged with `isSyntheticDemo: true`) so judges immediately see a full working causal network.

### 3. `src/rovo/actions.ts` (Rovo Agent Action Handlers)
Implement the exact handler functions referenced in `manifest.yml`:
1. `simulateDelayImpact(payload, context)`:
   - Extracts `issueKey` and `delayDays` from the Rovo action payload.
   - Loads the project DAG, runs `runIntervention(graph, issueKey, delayDays)` from `src/engine/simulator.ts`.
   - Returns a structured, markdown-formatted causal report showing P50/P85/P95 date shifts, blast radius issues, affected Goals, and concrete mitigation recommendations.
2. `analyzeCriticalPath(payload, context)`:
   - Computes the topological critical path and top 3 bottleneck nodes with the highest downstream ripple weight.
3. `seedDemoScenario(payload, context)`:
   - Loads the Project Chronos dataset into `storage` (`@forge/api` storage) and confirms readiness.

### 4. `src/mcp/server.ts` (Atlassian MCP Webtrigger Endpoint)
- Implement a JSON-RPC 2.0 / MCP-compatible handler for `mcp-world-model-endpoint`:
  - Supports `tools/list` (exposing `pwm_simulate_intervention` and `pwm_get_critical_path`).
  - Supports `tools/call` (executing the simulation engine and returning structured JSON results).

### 5. `src/index.ts` (Main Forge Resolver & Exports)
- Wire `@forge/resolver` definitions for the Custom UI (`getGraphData`, `runWhatIfSimulation`, `loadDemoScenario`, `resetScenario`).
- Export all Rovo action handlers and the MCP webtrigger handler matching the exact function names in `manifest.yml`.

Verify TypeScript compilation (`tsc --noEmit`) after creating these files and fix any type mismatches.
