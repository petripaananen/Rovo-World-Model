---
name: critical-path-executive-brief
description: >-
  Produces an executive sprint review and release readiness brief covering critical-path bottlenecks ranked by downstream ripple weight, 3-tier schedule buffers, Earned Value (CPI/SPI/EAC), and Teamwork Graph Goal health.
allowed-tools: analyze-critical-path
---

# Critical Path Executive Brief Playbook

Use this skill whenever a user asks for the top delivery bottlenecks, critical path, sprint readiness health, earned value metrics, or an executive release forecast summary.

## Workflow Steps

1. **Run Critical Path & Monte Carlo Diagnostics:**
   - Invoke `analyze-critical-path` with the active Jira `projectKey` (or omit `projectKey` to resolve from context).
   - Inspect `cycleWarnings` if circular links existed in Jira, `criticalPathNodes`, `superCriticalNodes`, `top3Bottlenecks`, `reserves`, `earnedValue`, `deliveryGovernance`, and `goalImpacts`.

2. **Synthesize Executive Forecast & 3-Tier Schedule Buffers:**
   - Present the three milestone dates clearly:
     - **Likely Finish (50% odds / Core Work Estimate)**
     - **Target Commit Date (85% safe)** — include the **Team Risk Buffer** (`pmContingencyReserveDays`)
     - **Safe Buffer Date (95% cutoff)** — include the **Executive Contingency** (`managementReserveDays`)
   - Report **Engineering Earned Value**: `CPI`, `SPI`, `EAC` (`eacTrendDays`), and whether WBS squad masking (`maskingWarning`) was detected.

3. **Highlight Top 3 Bottlenecks & Super-Critical Risks:**
   - Rank the top 3 blockers from `top3Bottlenecks` with issue key, owner/team, **Downstream Ripple Weight**, **Criticality Index (%)**, and **Mitigation ROI**.
   - Highlight any `superCriticalNodes` (negative float against deadline) and overallocated assignees (`overallocatedAssignees`).

4. **Summarize Teamwork Graph Goals & Action Plan:**
   - Report each **Teamwork Graph Goal** with target date, projected 85%-safe date, on-time probability (%), and status (`On Track`, `At Risk`, `Off Track`).
   - End with 2–3 prioritized, issue-specific de-risking actions referencing real Jira issue keys from the active project. Keep all prose clean Markdown without raw LaTeX notation (`$...$`).
