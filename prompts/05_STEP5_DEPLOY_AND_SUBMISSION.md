# STEP 5: FORGE DEPLOYMENT, VALIDATION & CODEGEIST SUBMISSION PREP

All backend and frontend modules are implemented. Execute **Step 5** to validate the build, prepare deployment, and generate the hackathon submission documentation.

## Tasks to Execute

### 1. Static Analysis & Build Verification
- Check that all function keys in `manifest.yml` match exported handlers in `src/index.ts`.
- Run TypeScript type-checking in the root directory and build the Custom UI in `static/ui/` so `static/ui/build/index.html` exists and is ready for `forge deploy`.
- Run `forge lint` (if Forge CLI is authenticated) and fix any manifest schema or permission scope warnings.

### 2. Rovo Agent Test Prompts (`ROVO_TEST_PROMPTS.md`)
Create a quick-reference file `ROVO_TEST_PROMPTS.md` containing 5 high-impact natural language prompts for testing the **Causal Time Machine Agent** inside Jira Rovo Chat during the demo video:
1. *"Simulate what happens to our Q4 Global Launch goal if CORE-104 is delayed by 10 days."*
2. *"Which 3 issues on our critical path have the highest causal blast radius right now?"*
3. *"If we want to ship by November 30 with 85% confidence (P85), which dependency should we decouple?"*
4. *"Seed the Project Chronos demo scenario and analyze cross-team bottlenecks between Core Engine and Cloud Infra."*
5. *"Generate an executive risk summary for our sprint review based on the current world model."*

### 3. Codegeist 2026 Devpost Submission Ready `README.md`
Create a comprehensive `README.md` structured specifically for Codegeist 2026 judges:
- **Inspiration & Problem:** Why static Jira boards and basic LLM summaries fail at predicting cascading multi-team delays—and why teams need a **Causal World Model**.
- **What It Does:** Combines **Atlassian Teamwork Graph**, **Project World Model (DAG + Monte Carlo $do$-calculus)**, **Jira Time Machine Custom UI**, **Rovo Agent Actions**, and an **Atlassian MCP Server**.
- **How We Built It:** Architecture diagram (ASCII/Mermaid) + breakdown of `src/engine/`, `src/twg/`, `src/rovo/`, `src/mcp/`, and `static/ui/`.
- **Judge Quick-Start Instructions:** Step-by-step instructions showing how a judge can install the app, open any Jira project, click **"Load Demo Scenario"**, drag the Time Machine scrubber, and invoke `@Causal Time Machine Agent` in Rovo Chat in under 2 minutes.
