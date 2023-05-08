
export const Methods = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete'
}

export const ImportStrategy = {
    FORCE_IMPOSE: 'FORCE_IMPOSE',
    FORCE_PUSH: 'FORCE_PUSH',
    NEW_RULE: 'NEW_RULE',
    NEW_VERSION: 'NEW_VERSION',
    CAREFUL: 'CAREFUL',
    NAIVE: 'NAIVE',
    DRY_RUN: 'DRY_RUN'
}

export const ImportStrategyDescription = {
    FORCE_IMPOSE: 'Deletes all the rules in target and imports rules from source',
    FORCE_PUSH: 'Imports rules from source and forces update on conflicting rules in target',
    NEW_RULE: 'Imports rules from source, conflicting rules are imported as rules with new rule id',
    NEW_VERSION: 'Imports rules from source, conflicting rules are imported as rules with new version (NOT RECOMMENDED)',
    CAREFUL: 'Imports rules from source, conflicting rules are not imported at all',
    NAIVE: 'Tries to straightforwardly import rules from source without analyzing conflicts (NOT RECOMMENDED)',
    DRY_RUN: 'Performs analysis of conflicting rules but does not change the target in any way'
}

export const ImportRuleFlowStrategy = {
    RULEFLOW_UPDATE_DRY_RUN: 'RULEFLOW_UPDATE_DRY_RUN',
    RULEFLOW_NEW_VERSION_DRY_RUN: 'RULEFLOW_NEW_VERSION_DRY_RUN',
    RULEFLOW_NEW_RULE_DRY_RUN: 'RULEFLOW_NEW_RULE_DRY_RUN',
    RULEFLOW_UPDATE: 'RULEFLOW_UPDATE',
    RULEFLOW_NEW_VERSION: 'RULEFLOW_NEW_VERSION',
    RULEFLOW_NEW_RULE: 'RULEFLOW_NEW_RULE'
}

export const ImportRuleFlowStrategyDescription = {
    RULEFLOW_UPDATE_DRY_RUN: 'Performs analysis of conflicting ruleflows but does not change the target in any way',
    RULEFLOW_NEW_VERSION_DRY_RUN: 'Performs analysis of conflicting ruleflows but does not change the target in any way',
    RULEFLOW_NEW_RULE_DRY_RUN: 'Performs analysis of conflicting ruleflows but does not change the target in any way',
    RULEFLOW_UPDATE: 'Only import RuleFlows! Imports a RuleFlow from the source and update it',
    RULEFLOW_NEW_VERSION: 'Only import RuleFlows! Imports a RuleFlow from the source, create the rule with a new version',
    RULEFLOW_NEW_RULE: 'Only import RuleFlows! Imports a new RuleFlow from the source, create the rule with version 1',
}

export const MigrationTag = {
    ADDED: 'ADDED',
    CONFLICT: 'CONFLICT',
    EXTRA: 'EXTRA',
    UPDATED: 'UPDATED',
}

export const ConfigSample = {
    "environments": {
        "staging": {
            "url": "https://api.decisionrules.io",
            "spaceName": "Staging Main",
            "managementApiKey": "your-staging-management-api-key"
        },
        "production": {
            "url": "https://api.decisionrules.io",
            "spaceName": "Production Main",
            "managementApiKey": "your-production-management-api-key"
        }
    }
}