export type ProfileId =
  | 'developer'
  | 'architect'
  | 'ba'
  | 'pm'
  | 'mulesoft'
  | 'ux'
  | 'cgcloud'
  | 'devops'
  | 'qa'
  | 'crma'
  | 'data360';

export type ProfileDescriptor = {
  id: ProfileId;
  label: string;
  ruleFile: string;
  description: string;
};

export type ToolId = 'cursor' | 'vscode' | 'codex' | 'agentforce';

export type ToolStatus = {
  id: ToolId;
  detected: boolean;
  reason: string;
};

export type RuleSummary = {
  path: string;
  relativePath: string;
  scope: 'generated' | 'custom';
};

export type RunLocalRequest = {
  profiles: ProfileId[];
  force: boolean;
  rules?: ToolId;
};

export type OrgDescriptor = {
  alias: string;
  username: string;
};

export type ConfigureMcpRequest = {
  orgs: string[];
  profiles: ProfileId[];
  allToolsets: boolean;
  global: boolean;
};

export type UiToHostMessage =
  | { type: 'bootstrap' }
  | { type: 'runLocal'; payload: RunLocalRequest }
  | { type: 'listRules' }
  | { type: 'readRule'; payload: { path: string } }
  | { type: 'saveRule'; payload: { path: string; content: string } }
  | { type: 'importRuleFromUrl'; payload: { url: string; tool: ToolId } }
  | { type: 'importRuleFromFile'; payload: { tool: ToolId } }
  | { type: 'listOrgs' }
  | { type: 'loginOrg'; payload: { alias: string } }
  | { type: 'configureMcp'; payload: ConfigureMcpRequest };

export type HostToUiMessage =
  | { type: 'bootstrapResult'; payload: { tools: ToolStatus[]; profiles: ProfileDescriptor[] } }
  | { type: 'commandOutput'; payload: { stream: 'stdout' | 'stderr'; text: string } }
  | { type: 'commandComplete'; payload: { code: number | null; command: string } }
  | { type: 'rulesResult'; payload: RuleSummary[] }
  | { type: 'ruleContent'; payload: { path: string; content: string } }
  | { type: 'operationError'; payload: { message: string } }
  | { type: 'operationSuccess'; payload: { message: string } }
  | { type: 'orgsResult'; payload: { orgs: OrgDescriptor[]; sfExtensionInstalled: boolean } }
  | { type: 'orgLoginResult'; payload: { success: boolean; alias: string } }
  | { type: 'mcpConfigured'; payload: { mcpFile: string; serversAdded: string[] } };
