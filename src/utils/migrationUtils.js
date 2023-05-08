import { Methods } from "./models.js";
import { AccessUtils } from "./accessUtils.js";
import { RuleUtils } from "./ruleUtils.js";
import chalk from "chalk";


export class MigrationUtils {

    constructor() { }

    // RULEFLOW FUNCTIONS
    static async exportRuleFlowToFile(environment, fileName, ruleFlowId, versionRuleFlow) {     
        const rule = await MigrationUtils.getRuleFlowByExport(environment, ruleFlowId, versionRuleFlow);
        MigrationUtils.logRule(rule[0], 'EXPORT');        
        await AccessUtils.writeRulesToFile(fileName, rule);
    }

    static async getRuleFlowByExport(environment, ruleFlowId, versionRuleFlow) {
        const path = `/api/rule-flow/export/${ruleFlowId}/${versionRuleFlow ? versionRuleFlow : ''}`;
        const res = await AccessUtils.callManagementApi(Methods.GET, environment, path);        
        if (typeof res !== 'object') {
            throw new Error(`Get ruleflow with path [${path}] failed, did not get object`);
        }
        return res;
    }
    
    static async createRuleFlow(environment, ruleFlowData) {        
        MigrationUtils.logRule(ruleFlowData, 'CREATE');

        const path =  `/api/${RuleUtils.ruleTypePath(ruleFlowData.type)}/`
        const res = await AccessUtils.callManagementApi(Methods.POST, environment, path, ruleFlowData);
        return res;    
    }

    static async updateRuleFlow(environment, ruleFlowData) {    
        MigrationUtils.logRule(ruleFlowData, 'UPDATE');

        const path = `/api/${RuleUtils.ruleTypePath(ruleFlowData.type)}/${RuleUtils.baseId(ruleFlowData)}/${ruleFlowData.version}`;
        const res = await AccessUtils.callManagementApi(Methods.PUT, environment, path, ruleFlowData);
        return res;
    }

    static async deleteRuleFlow(environment, rules, debug) {
        const results = [];
        for (let rule of rules) {
            if (debug) {
                MigrationUtils.logRule(rule);
            }
            const path = `/api/${RuleUtils.ruleTypePath(rule.type)}/${RuleUtils.baseId(rule)}`;
            const res = await AccessUtils.callManagementApi(Methods.DELETE, environment, path);
            results.push(res);
        }
        return results;
    }

    static async exportRulesToFile(environment, exportOptions, fileName, debug) {
        let items = await MigrationUtils.getSpaceItems(environment);
        const requests = [];
        for (let item of items) {
            if (MigrationUtils.itemFilter(item, exportOptions)) {
                const req = MigrationUtils.getRule(environment, item);
                requests.push(req);
            }
        }
        const rules = await Promise.all(requests);
        if (debug) {
            rules.forEach((rule) => {
                MigrationUtils.logRule(rule, 'EXPORT');
            });
        }
        await AccessUtils.writeRulesToFile(fileName, rules);
    }

    static async getRule(environment, ruleInfo) {
        const path = `/api/${RuleUtils.ruleTypePath(ruleInfo.type)}/${RuleUtils.baseId(ruleInfo)}/${ruleInfo.version}`;
        const res = await AccessUtils.callManagementApi(Methods.GET, environment, path);
        if (typeof res !== 'object') {
            throw new Error(`Get rule with path [${path}] failed, did not get object`);
        }
        return res;
    }

    static itemFilter(item, exportOptions) {
        if (!exportOptions) {
            return true;
        }
        let includeTagsPass = true;
        let excludeTagsPass = true;
        if (Array.isArray(exportOptions.includeTags)) {
            includeTagsPass = exportOptions.includeTags.map(tag => item.tags.includes(tag)).reduce((a, b) => a || b);
        }
        if (Array.isArray(exportOptions.excludeTags)) {
            excludeTagsPass = exportOptions.excludeTags.map(tag => !item.tags.includes(tag)).reduce((a, b) => a && b);
        }
        return includeTagsPass && excludeTagsPass;
    }

    static async getSpaceItems(environment) {
        const path = `/api/space/items`;
        const items = await AccessUtils.callManagementApi(Methods.GET, environment, path);
        if (!Array.isArray(items)) {
            throw new Error(`Reading space items for environment [${environment.name}] failed, did not get array`);
        }
        return items;
    }

    static async createRules(environment, rules, debug) {
        const results = [];
        for (let rule of rules) {
            if (debug) {
                MigrationUtils.logRule(rule);
            }
            const res = await AccessUtils.callManagementApi(
                Methods.POST,
                environment,
                `/api/${RuleUtils.ruleTypePath(rule.type)}/`,
                rule
            );            
            results.push(res);
        }
        return results;
    }

    static async updateRules(environment, rules, debug) {
        const results = [];
        for (let rule of rules) {
            if (debug) {
                MigrationUtils.logRule(rule);
            }
            const path = `/api/${RuleUtils.ruleTypePath(rule.type)}/${RuleUtils.baseId(rule)}/${rule.version}`;
            const res = await AccessUtils.callManagementApi(Methods.PUT, environment, path, rule);
            results.push(res);
        }
        return results;
    }

    static async deleteRules(environment, rules, debug, ignoreVersion = false) {
        const results = [];
        for (let rule of rules) {
            if (debug) {
                MigrationUtils.logRule(rule);
            }
            const path = `/api/${RuleUtils.ruleTypePath(rule.type)}/${RuleUtils.baseId(rule)}/${ignoreVersion? '' : rule.version}`;
            const res = await AccessUtils.callManagementApi(Methods.DELETE, environment, path);
            results.push(res);
        }
        return results;
    }

    static logRule(rule, prefix = '') {
        if (prefix !== '') {
            prefix += ' ';
        }
        if (rule?.baseId || rule?.ruleId || rule?.compositionId) {
            console.info(chalk.blue(`${prefix}ID=${RuleUtils.baseId(rule)} VERSION=${rule.version} ALIAS=${rule.ruleAlias} NAME=${rule.name} TYPE=${rule.type}` ));
        } else {
            let loggedRule;
            try {
                loggedRule = JSON.stringify(rule);
            } catch {
                loggedRule = rule;
            }
            console.info(chalk.blue(`${prefix}NO RULE [${loggedRule}]`));
        }
    }
}