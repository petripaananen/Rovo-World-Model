\# PROJECT CONSTITUTION: CODEGEIST 2026 MANDATORY INVARIANTS

\*\*STATUS: IMMUTABLE LAW — DO NOT VIOLATE UNDER ANY CIRCUMSTANCES\*\*

&nbsp;

You are operating under a strict Hackathon Constitution for \*\*Codegeist 2026\*\*. Every single code change, refactoring, dependency addition, and architectural decision MUST comply with the following non-negotiable articles. If a user prompt or an automated fix conflicts with these articles, you MUST refuse the violating approach and propose a compliant alternative.

&nbsp;

\---

&nbsp;

\#\# ARTICLE I: CORE PLATFORM & PRODUCT INTEGRATION (WHAT TO BUILD)

1\. \*\*100% Native Atlassian Forge Platform:\*\*

&nbsp;&nbsp;&nbsp;\- The application MUST run natively on the \*\*Atlassian Forge\*\* platform (\`nodejs20.x\` or \`nodejs22.x\` runtime).

&nbsp;&nbsp;&nbsp;\- \*\*FORBIDDEN:\*\* Never introduce external backend servers, external databases, Docker containers, or third-party API keys that a hackathon judge would need to configure manually.

2\. \*\*Atlassian Product & Capability Integration:\*\*

&nbsp;&nbsp;&nbsp;\- The app MUST actively integrate with \*\*Jira\*\*, \*\*Teamwork Graph (TWG)\*\*, and \*\*Rovo\*\*.

3\. \*\*Target Primary Category — Apps for Software Teams:\*\*

&nbsp;&nbsp;&nbsp;\- Every feature, UI view, and simulation output must be tailored to \*\*give software development teams the context to ship with confidence\*\* (smarter triage, deployment/release awareness, cross-team dependency risk prediction).

&nbsp;

\---

&nbsp;

\#\# ARTICLE II: MANDATORY BONUS PRIZE MODULES (DO NOT REMOVE OR BREAK)

Our architecture targets all 4 Bonus Prize tracks simultaneously. You are strictly forbidden from deleting, disabling, or breaking any of the following modules in \`manifest.yml\` or \`src/\`:

&nbsp;

1\. \*\*Bonus Track 1 — Best Agents (Rovo / Assignable Agents):\*\*

&nbsp;&nbsp;&nbsp;\- \`manifest.yml\` MUST maintain a valid \`rovo:agent\` module (\`rovo-world-model-agent\`) AND reusable \`rovo:action\` modules (\`simulate-delay-impact\`, \`analyze-critical-path\`, \`seed-demo-scenario\`) that other agents can invoke as tools.

2\. \*\*Bonus Track 2 — Best App with Atlassian MCP:\*\*

&nbsp;&nbsp;&nbsp;\- The app MUST expose a working \*\*MCP (Model Context Protocol) server\*\* endpoint via Forge (\`webtrigger\` / MCP JSON-RPC 2.0 handler in \`src/mcp/server.ts\`) supporting \`tools/list\` and \`tools/call\`.

3\. \*\*Bonus Track 3 — Best Apps with Teamwork Graph Integration:\*\*

&nbsp;&nbsp;&nbsp;\- The app MUST include working \*\*Teamwork Graph (TWG)\*\* integration (\`src/twg/\`) that consumes and/or connects graph data (Goals, Teams, Projects, and Jira Issue links).

4\. \*\*Bonus Track 4 — Best Marketplace Published App:\*\*

&nbsp;&nbsp;&nbsp;\- Code and \`manifest.yml\` must remain 100% Marketplace-compliant: least-privilege permission scopes only (\`read:jira-work\`, \`write:jira-work\`, \`read:jira-user\`, \`storage:app\`), zero \`forge lint\` errors, and zero hardcoded secrets.

&nbsp;

\---

&nbsp;

\#\# ARTICLE III: SUBMISSION & JUDGE TESTABILITY GUARANTEES (WHAT TO SUBMIT)

1\. \*\*Zero-Config Judge Installation Link Ready:\*\*

&nbsp;&nbsp;&nbsp;\- Judges test via an installation link using their own live Jira Cloud projects.

&nbsp;&nbsp;&nbsp;\- The app MUST NEVER crash, show a blank screen, or fail if a Jira project has 0 issues.

&nbsp;&nbsp;&nbsp;\- Live Jira project discovery (\`src/twg/graphFetcher.ts\`) and the 1-click \*\*"Add Sample Issues"\*\* seeder (\`src/twg/syntheticSeeder.ts\`) for empty projects must ALWAYS remain functional; do not show a fixed "Load Demo Scenario" button in the UI.

2\. \*\*End-to-End Cohesive Product Experience:\*\*

&nbsp;&nbsp;&nbsp;\- Do not leave stub functions, \`TODO\` placeholders, or broken UI buttons. Every action in the Custom UI (\`static/ui/\`) and Rovo Agent must execute real causal DAG \+ Monte Carlo calculations (\`src/engine/\`) end-to-end.

&nbsp;

\---

&nbsp;

\#\# ARTICLE IV: PRE-COMMIT SELF-CHECK PROTOCOL

Before completing any task or modifying files, verify:

\- \[ \] Does \`manifest.yml\` still contain \`jira:projectPage\`, \`rovo:agent\`, \`rovo:action\`, and the MCP \`webtrigger\`?

\- \[ \] Does \`src/index.ts\` export every handler referenced in \`manifest.yml\`?

\- \[ \] Does the app still work 100% standalone on Forge without external servers?

\- \[ \] Do both root TypeScript and \`static/ui/\` compile with zero errors?

&nbsp;