

export class RuleUtils {

    static ruleTypePath(ruleType) {
        return ruleType === 'composition' ? 'rule-flow' : 'rule';
    }

    static baseId(rule) {
        return rule.baseId ?? rule.ruleId ?? rule.compositionId ?? null;
    }

    static updateBaseId(rule,newBaseId) {
        if (rule.baseId) {
            rule.baseId = newBaseId;
        }
        if (rule.ruleId) {
            rule.ruleId = newBaseId;
        }
        if (rule.compositionId) {
            rule.compositionId = newBaseId;
        }
    }

    static id(rule) {
        const baseId = rule.baseId ?? rule.ruleId ?? rule.compositionId;
        if (!baseId || !rule.version) {
            return null;
        }
        return baseId + '_' + rule.version;
    }

    static ruleIdComparator(ruleA, ruleB) {
        return RuleUtils.id(ruleA) !== null && RuleUtils.id(ruleA) === RuleUtils.id(ruleB);
    }

    static ruleComparator(ruleA, ruleB) {
        const ra = {...ruleA};
        const rb = {...ruleB};
        delete ra.lastUpdate;
        delete rb.lastUpdate;
        delete ra.createdIn;
        delete rb.createdIn;
        delete ra._id;
        delete rb._id;
        ra.tags = RuleUtils.removeMigrationTags(ra.tags);
        rb.tags = RuleUtils.removeMigrationTags(rb.tags);
        // Does not work perfectly (e.g. false positives for reordered key value pairs)
        // but is relatively fast and enough accurate for our case
        return JSON.stringify(ra) === JSON.stringify(rb);
    }

    static isMigrationTag(tag) {
        const pattern = new RegExp(`\[[A-Za-z0-9]\]`);
        return pattern.test(tag);
    }

    static removeMigrationTags(tags) {
        if (!tags) {
            return [];
        }
        return tags?.filter((tag) => !RuleUtils.isMigrationTag(tag));
    }

    static updateMigrationTags(tags, migrationTagType, traceId) {
        let newTags = [];
        if (tags) {
            newTags = RuleUtils.removeMigrationTags(tags);
        }
        newTags.push(`[${traceId}]${migrationTagType}`);
        return newTags;
    }
}
