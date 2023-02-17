import {Methods} from "./models.js";
import {AccessUtils} from "./accessUtils.js";
import {RuleUtils} from "./ruleUtils.js";


export class MigrationUtils {

    constructor() {}

    static async exportRulesToFile(environment,exportOptions,fileName) {
        let items = await MigrationUtils.getSpaceItems(environment);
        const requests = [];
        for (let item of items) {
            if (MigrationUtils.itemFilter(item,exportOptions)) {
                const req = MigrationUtils.getRule(environment,item);
                requests.push(req);
            }
        }
        const rules = await Promise.all(requests);
        await AccessUtils.writeRulesToFile(fileName,rules);
    }

    static itemFilter(item,exportOptions) {
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

    static async getRule(environment,ruleInfo) {
        const path = `/api/${RuleUtils.ruleTypePath(ruleInfo.type)}/${RuleUtils.baseId(ruleInfo)}/${ruleInfo.version}`;
        const res = await AccessUtils.callManagementApi(Methods.GET, environment, path);
        if (typeof res !== 'object') {
            throw new Error(`Get rule with path [${path}] failed, did not get object`);
        }
        return res;
    }

    static async getSpaceItems(environment) {
        const path = `/api/space/items`;
        const items = await AccessUtils.callManagementApi(Methods.GET, environment, path);
        if (!Array.isArray(items)) {
            throw new Error(`Reading space items for environment [${environment.name}] failed, did not get array`);
        }
        return items;
    }

    static async createRules(environment, rules) {
        const results = [];
        for (let rule of rules) {
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

    static async updateRules(environment,rules) {
        const results = [];
        for (let rule of rules) {
            const path = `/api/${RuleUtils.ruleTypePath(rule.type)}/${RuleUtils.baseId(rule)}/${rule.version}`;
            const res = await AccessUtils.callManagementApi(Methods.PUT, environment, path, rule);
            results.push(res);
        }
        return results;
    }

    static async deleteRules(environment,rules) {
        const results = [];
        for (let rule of rules) {
            const path = `/api/${RuleUtils.ruleTypePath(rule.type)}/${RuleUtils.baseId(rule)}/${rule.version}`;
            const res = await AccessUtils.callManagementApi(Methods.DELETE, environment, path);
            results.push(res);
        }
        return results;
    }
}