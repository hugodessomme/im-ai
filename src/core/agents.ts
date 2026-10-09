/** The agents that im-ai can install resources for. Agent adapters come with the install features. */
export const agentIds = ["claude", "codex"] as const;

export type AgentId = (typeof agentIds)[number];

export function isAgentId(name: unknown): name is AgentId {
  return (agentIds as readonly unknown[]).includes(name);
}
