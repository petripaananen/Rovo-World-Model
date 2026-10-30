# CODEGEIST 2026: HACKATHON CONTEXT, RULES & RESOURCES

Use this file as the ground-truth reference (`@HACKATHON_CONTEXT.md`) for compliance, judging criteria, bonus categories, and Atlassian Forge technical constraints.

## 1. Hackathon Core Info
- **Event:** Codegeist 2026: Build with context. Ship with confidence.
- **Deadline:** December 22, 2026 @ 12:00pm PST
- **Official URLs:**
  - Main Page: https://codegeist2026.devpost.com/
  - Rules: https://codegeist2026.devpost.com/rules
  - Resources: https://codegeist2026.devpost.com/resources

## 2. Core Technical Requirements
- Must be built on **Atlassian Forge** (`nodejs20.x` or `nodejs22.x` runtime).
- Must integrate with at least one Atlassian product or platform capability: **Jira, Confluence, Jira Service Management, Bitbucket, Teamwork Graph (TWG), or Rovo**.
- **Category Selection:** Apps for Software Teams (Primary).

## 3. Target Bonus Prizes ($1,500 each)
1. **Best Agents - Rovo / Assignable Agents:**
   - Must use `rovo:agent` or `rovo:agentConnector` modules, OR provide reusable `rovo:skill` / `rovo:action` modules that other agents can invoke as tools.
2. **Best App with Atlassian MCP:**
   - Must expose an MCP (Model Context Protocol) server or endpoint via Forge (`webtrigger` / MCP tool definition).
3. **Best Apps with Teamwork Graph Integration:**
   - Must ingest data into the Teamwork Graph and/or consume organizational graph data (Goals, Teams, Projects, Issues, Confluence decisions) via the TWG GraphQL API.
4. **Best Marketplace Published App:**
   - Clean permissions, zero external unverified dependencies, ready for Marketplace submission.

## 4. Judging Criteria (20% each)
- **Technological Implementation (20%):** Depth of Forge usage, clean architecture, working non-trivial causal engine.
- **Design (20%):** Cohesive, polished product experience (Custom UI / Atlaskit dark-mode support, intuitive visual cockpit) rather than a rough PoC.
- **Potential Impact (20%):** Solves a critical real-world problem (predicting cascading delivery risks across silos before they happen).
- **Innovation / Idea (20%):** Moving beyond simple LLM text summaries to a **Causal World Model (DAG + Counterfactual $do$-calculus)**.
- **Presentation (20%):** End-to-end working demo flow with a 1-click "Seed Realistic Demo Scenario" button for judges testing on empty Jira Cloud instances.
