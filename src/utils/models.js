
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
    NAIVE: 'NAIVE',
    DRY_RUN: 'DRY_RUN'
}

export const ImportStrategyDescription = {
    FORCE_IMPOSE: 'Deletes all the rules in target and imports rules from source',
    FORCE_PUSH: 'Imports rules from source and forces update on conflicting rules in target',
    NEW_RULE: 'Imports rules from source, conflicting rules are imported as rules with new rule id',
    NEW_VERSION: 'Imports rules from source, conflicting rules are imported as rules with new version',
    NAIVE: 'Tries to straightforwardly import rules from source without resolving conflicts (may fail)',
    DRY_RUN: 'Performs analysis of conflicting rules but does not change the target in any way'
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