---
name: causal-recovery-advisor
description: >-
  Compares counterfactual schedule delays and recovery mitigations (+1 developer with Brooks's Law drag, dependency decoupling, MVP scope trimming, and assignee workload rebalancing) using Rovo-World-Model Monte Carlo forecasting.
allowed-tools: simulate-delay-impact
---

# Causal Recovery Advisor Playbook

Use this skill whenever a user asks how a slip, acceleration, assignee unavailability, or recovery lever changes Jira release dates, downstream blast radius, or Teamwork Graph goals.

## Workflow Steps

1. **Identify Active Context & Target:**
   - Use the active Jira project key (`projectKey`) and the user's named Jira issue (`issueKey`) or assignee (`assigneeName`). Do not invent Chronos or placeholder keys when analyzing a live project.
   - If the user asks about a teammate's capacity, PTO, or overload without naming a specific issue, pass `assigneeName`, `unavailableDays`, and/or `personMitigation` (`reassign`, `serialize`, `pair`) directly to `simulate-delay-impact`.

2. **Measure Baseline / Counterfactual Scenario First:**
   - Invoke `simulate-delay-impact` with the requested shift (`delayDays` between `-5` and `+60`) or person parameters (`unavailableDays` between `-3` and `+15`).
   - For multi-issue combined what-if requests, include secondary overrides via `compoundOverridesJson` (JSON object mapping issue keys to `{ "deltaDays": number, "addDeveloper": boolean, "decoupleBlockingEdges": boolean, "trimScope": boolean }`).

3. **Test Recovery Levers When Slip Risk Appears:**
   - Compare high-leverage mitigations by invoking `simulate-delay-impact` with one or more levers toggled on:
     - `addDeveloper: true` (+1 engineer swarm adjusted for Brooks's Law communication and onboarding drag)
     - `decoupleBlockingEdges: true` (interface contract decoupling reducing blocking edge weight from 1.0 to 0.25)
     - `trimScope: true` (deferring non-essential sub-tasks for MVP delivery)
     - `personMitigation: "reassign,serialize,pair"` (rebalancing parallel overload for `assigneeName`)

4. **Present a Decision-Ready Comparison Table:**
   - Always report plain-language confidence milestones in a concise markdown table:
     - **Likely Finish (50% odds)** (before vs. after and net Δ days)
     - **Target Commit Date (85% safe)** (before vs. after and net Δ days)
     - **Safe Buffer Date (95% cutoff)** (tail-risk cutoff)
   - List the downstream **Blast Radius** issue keys, any **Teamwork Graph Goals** that move to `At Risk` or `Off Track`, and a concrete recommendation ranked by days recovered on **Target Commit Date (85% safe)**.
   - Never output raw LaTeX notation (`$...$`); use plain ASCII or Unicode (`Δ`).
