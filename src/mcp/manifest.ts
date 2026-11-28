/**
 * Project World Model (PWM) — Browser-Safe MCP Tools Manifest (`src/mcp/manifest.ts`)
 *
 * Pure schema and metadata definitions with zero Node/Forge runtime dependencies,
 * shared safely between `src/mcp/server.ts` and the Custom UI cockpit.
 */

export const PROJECT_KEY_DESCRIPTION =
  'Optional Jira project key (defaults to active live Jira project, or Project Chronos fallback when empty/offline)';

export const SIMULATE_INTERVENTION_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    issueKey: {
      type: 'string',
      description:
        'Optional Jira issue key to intervene on (defaults to top critical-path bottleneck or assignee blocker)',
    },
    delayDays: {
      type: 'number',
      description:
        'Signed counterfactual shift in days (-5 to +60; defaults to 0 when mitigations/overrides are set, else 7)',
    },
    addDeveloper: {
      type: 'boolean',
      description: 'Simulate adding a developer (+1 resource swarm)',
    },
    decoupleBlockingEdges: {
      type: 'boolean',
      description: 'Simulate decoupling hard blocking outgoing edges',
    },
    trimScope: {
      type: 'boolean',
      description:
        'Simulate trimming or deferring non-essential sub-tasks to the next cycle (-35% duration, -45% uncertainty)',
    },
    assigneeName: {
      type: 'string',
      description:
        'Optional Jira assignee display name for person-level capacity or absence simulation',
    },
    unavailableDays: {
      type: 'number',
      description:
        'Signed unavailability or PTO shift in days (-3 to +15) across the assignee active issues',
    },
    personMitigation: {
      type: 'string',
      description:
        'Comma-separated person mitigations (reassign, serialize, pair) for assigneeName',
    },
    reassignBottleneck: {
      type: 'boolean',
      description:
        'Offload assignee parallel bottleneck issue to eliminate concurrent WIP contention',
    },
    serializeParallelWork: {
      type: 'boolean',
      description:
        'Serialize assignee concurrent tasks to eliminate context-switching variance',
    },
    pairOnTopBlocker: {
      type: 'boolean',
      description:
        'Pair an extra developer on assignee highest-impact critical blocker issue',
    },
    compoundOverridesJson: {
      type: 'string',
      description:
        'Optional JSON string mapping additional issue keys to { deltaDays, addDeveloper, decoupleBlockingEdges, trimScope }',
    },
    nodeOverrides: {
      type: 'object',
      description:
        'Optional map of additional issue keys to { deltaDays, addDeveloper, decoupleBlockingEdges, trimScope } for compound multi-task What-If simulation',
    },
    assigneeOverrides: {
      type: 'object',
      description:
        'Optional map of assignee display names to { assignee, unavailableDays, reassignBottleneck, serializeParallelWork, pairOnTopBlocker } for person-level capacity simulation',
    },
    projectKey: {
      type: 'string',
      description: PROJECT_KEY_DESCRIPTION,
    },
    cloudId: {
      type: 'string',
      description:
        'Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries',
    },
  },
};

export const MCP_TOOLS_MANIFEST = [
  {
    name: 'pwm_simulate_intervention',
    description:
      'Runs a 500-iteration Pearl do-calculus counterfactual Monte Carlo simulation do(issueKey = deltaDays) on the Project World Model DAG supporting recovery mitigations, person capacity, and compound overrides.',
    inputSchema: SIMULATE_INTERVENTION_INPUT_SCHEMA,
  },
  {
    name: 'pwm_get_critical_path',
    description:
      'Computes cycle-safe topological sorting, critical path nodes, top 3 bottlenecks by downstream ripple weight, and P50/P85/P95 completion dates.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: PROJECT_KEY_DESCRIPTION,
        },
        cloudId: {
          type: 'string',
          description:
            'Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries',
        },
      },
    },
  },
  {
    name: 'pwm_simulate_delay_impact',
    description:
      'Alias for pwm_simulate_intervention — runs counterfactual simulation supporting issue shifts, mitigations, person capacity, and compound overrides.',
    inputSchema: SIMULATE_INTERVENTION_INPUT_SCHEMA,
  },
  {
    name: 'pwm_analyze_critical_path',
    description:
      'Alias for pwm_get_critical_path — returns topological critical path and top bottlenecks.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: PROJECT_KEY_DESCRIPTION,
        },
        cloudId: {
          type: 'string',
          description:
            'Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries',
        },
      },
    },
  },
  {
    name: 'pwm_seed_demo_scenario',
    description:
      'Seeds the 18-node Project Chronos: Next-Gen Platform Launch multi-team dependency graph across 3 teams and 2 Teamwork Graph Goals.',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: PROJECT_KEY_DESCRIPTION,
        },
        populateJiraIssues: { type: 'boolean' },
      },
    },
  },
  {
    name: 'pwm_get_causal_graph',
    description:
      'Returns the complete Project World Model DAG (nodes, causal edges, Teamwork Graph goals, teams, and topological order).',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: PROJECT_KEY_DESCRIPTION,
        },
        cloudId: {
          type: 'string',
          description:
            'Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries',
        },
      },
    },
  },
];
