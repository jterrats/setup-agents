import type { ProfileDescriptor } from './types';

export const ALL_PROFILES: ProfileDescriptor[] = [
  {
    id: 'developer',
    label: 'Developer',
    ruleFile: 'developer-standards.mdc',
    description: 'Apex/LWC/trigger implementation profile.',
  },
  {
    id: 'architect',
    label: 'Architect',
    ruleFile: 'architect-standards.mdc',
    description: 'System design, tradeoff, and ADR profile.',
  },
  {
    id: 'ba',
    label: 'Business Analyst',
    ruleFile: 'ba-standards.mdc',
    description: 'Requirements and acceptance-criteria profile.',
  },
  {
    id: 'mulesoft',
    label: 'MuleSoft',
    ruleFile: 'mulesoft-standards.mdc',
    description: 'Integration-first architecture profile.',
  },
  {
    id: 'ux',
    label: 'UX / UI',
    ruleFile: 'ux-standards.mdc',
    description: 'User experience and interaction profile.',
  },
  {
    id: 'cgcloud',
    label: 'CGCloud',
    ruleFile: 'cgcloud-standards.mdc',
    description: 'Consumer Goods Cloud domain profile.',
  },
  {
    id: 'devops',
    label: 'DevOps / Release Manager',
    ruleFile: 'devops-standards.mdc',
    description: 'Release pipeline and deployment profile.',
  },
  {
    id: 'qa',
    label: 'QA',
    ruleFile: 'qa-standards.mdc',
    description: 'Playwright and test strategy profile.',
  },
  {
    id: 'crma',
    label: 'CRM Analytics',
    ruleFile: 'analytics-standards.mdc',
    description: 'Analytics dataflow and dashboard profile.',
  },
  {
    id: 'data360',
    label: 'Data Cloud',
    ruleFile: 'data360-standards.mdc',
    description: 'Data stream and identity profile.',
  },
];

export const GENERATED_RULE_DIRS = ['.cursor/rules', '.a4drules', '.a4drules/workflows'];
export const CUSTOM_RULE_DIRS = ['.cursor/rules/custom', '.a4drules/custom'];
