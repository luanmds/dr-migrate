
export const Methods = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
}

export const ImportStrategy = {
    FORCE_IMPOSE: 'FORCE_IMPOSE',
    FORCE_PUSH: 'FORCE_PUSH',
    NEW_RULE: 'NEW_RULE',
    NEW_VERSION: 'NEW_VERSION',
    NAIVE: 'NAIVE'
}

export const ImportStrategyDescription = {
    FORCE_IMPOSE: 'Deletes all the rules in target and imports rules from source',
    FORCE_PUSH: 'Imports rules from source and forces update on conflicting rules in target',
    NEW_RULE: 'Imports rules from source, conflicting rules are imported as rules with new rule id',
    NEW_VERSION: 'Imports rules from source, conflicting rules are imported as rules with new version',
    NAIVE: 'Tries to straightforwardly import rules from source without resolving conflicts (may fail)',
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
            "host": "api.decisionrules.io",
            "port": 80,
            "spaceName": "Staging Main",
            "managementApiKey": "your-staging-management-api-key"
        },
        "production": {
            "host": "api.decisionrules.io",
            "port": 80,
            "spaceName": "Production Main",
            "managementApiKey": "your-production-management-api-key"
        }
    }
}