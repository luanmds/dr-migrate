import {ImportStrategy, MigrationTag} from "./utils/models.js";
import _ from "lodash";
import chalk from "chalk";
import {AccessUtils} from "./utils/accessUtils.js";
import {RuleUtils} from "./utils/ruleUtils.js";
import {MigrationUtils} from "./utils/migrationUtils.js";


export class Migration {

    configFileName;
    config;
    traceId;

    constructor(traceId,configFileName) {
        this.configFileName = configFileName;
        this.traceId = traceId;
    }

    async init() {
        this.config = await AccessUtils.readConfigFile(this.configFileName);
    }

    exportOptions(includeTags,excludeTags) {
        if (includeTags || excludeTags) {
            return {
                includeTags: includeTags ?? null,
                excludeTags: excludeTags ?? null
            }
        }
        return null;
    }

    async exportRules(env,includeTags,excludeTags) {
        try {
            console.info(chalk.magenta(`[${this.traceId}] Export from [${env}] started`));
            const source = this.getEnvironment(env);
            const exportOptions = this.exportOptions(includeTags,excludeTags);
            const sourceFileName = `rules_${this.traceId}_source`;

            await MigrationUtils.exportRulesToFile(source,exportOptions,sourceFileName);
            console.info(chalk.magenta(`[${this.traceId}] Source exported to file [${sourceFileName}]`));

            const sourceRules = await AccessUtils.readRulesFromFile(sourceFileName);
            console.info(chalk.magenta(`[${this.traceId}] Export complete!`));
            console.info(chalk.magenta(`[${this.traceId}] Visible EXPORTED volume: ${sourceRules.length}\n`));
        } catch (e) {
            console.error(chalk.red(`[${this.traceId}] Export from [${env}] errored`));
            console.error(chalk.red(`[${this.traceId}] ${e}\n`));
        }
    }

    async importRules(env,importStrategy) {
        let writePhase = false;
        try {
            const target = this.getEnvironment(env);
            this.importRulesValidator(importStrategy);

            console.info(chalk.magenta(`[${this.traceId}] Import with strategy [${importStrategy}] to [${target.name}] started`));

            const sourceFileName = `rules_${this.traceId}_source`;
            const targetFileName = `rules_${this.traceId}_target`;

            const sourceRules = await AccessUtils.readRulesFromFile(sourceFileName);
            console.info(chalk.magenta(`[${this.traceId}] Source recovered from file [${sourceFileName}]`));

            await MigrationUtils.exportRulesToFile(target,null,targetFileName);
            const targetRules = await AccessUtils.readRulesFromFile(targetFileName);
            console.info(chalk.magenta(`[${this.traceId}] Target exported to file [${targetFileName}]`));

            const [rulesToAdd, rulesToUpdate, rulesToDelete, stats] = this.mergeRules(sourceRules,targetRules,importStrategy,this.traceId);

            writePhase = true;

            if (rulesToDelete.length > 0) {
                console.info(chalk.magenta(`[${this.traceId}] Deleting rules in target`));
                await MigrationUtils.deleteRules(target,rulesToDelete);
            }
            if (rulesToAdd.length > 0) {
                console.info(chalk.magenta(`[${this.traceId}] Importing rules to target`));
                await MigrationUtils.createRules(target,rulesToAdd);
            }
            if (rulesToUpdate.length > 0) {
                console.info(chalk.magenta(`[${this.traceId}] Updating rules in target`));
                await MigrationUtils.updateRules(target,rulesToUpdate);
            }

            this.importSuccessLog(stats);
        } catch (e) {
            this.importErrorLog(env,writePhase,e);
        }
    }

    importRulesValidator(importStrategy) {
        if (Object.values(ImportStrategy).indexOf(importStrategy) === -1) {
            throw new Error(`Invalid import strategy [${importStrategy}]`);
        }
    }

    importSuccessLog(stats) {
        console.info(chalk.magenta(`[${this.traceId}] Import complete!`));
        console.info(chalk.magenta(`[${this.traceId}] Visible volume of SOURCE / TARGET before the import:      ${stats.sourceVolume} / ${stats.targetVolume}`));
        console.info(chalk.magenta(`[${this.traceId}] SOURCE EXTRA / INTERSECTION (CONFLICTS) / TARGET EXTRA:   ${stats.sourceExtraVolume} / ${stats.intersectionVolume} (${stats.conflictVolume}) / ${stats.targetExtraVolume}`));
        console.info(chalk.magenta(`[${this.traceId}] ADDED TO TARGET / UPDATED IN TARGET / DELETED IN TARGET:  ${stats.addedVolume} / ${stats.updatedVolume} / ${stats.deletedVolume}\n`));
    }

    importErrorLog(env,writePhase,e) {
        console.error(chalk.red(`[${this.traceId}] Import errored`));
        console.error(chalk.red(`[${this.traceId}] ${e}`));
        if (writePhase) {
            console.error(chalk.red(`[${this.traceId}] Please check target [${env}] for potential inconsistencies\n`));
        } else {
            console.error(chalk.red(`[${this.traceId}] Import aborted before write operations, target [${env}] not affected\n`));
        }
    }

    mergeRules(sourceRules,targetRules,importStrategy) {

        let sameRules;
        let sourceExtras;
        let targetExtras;

        let rulesToAdd = [];
        const rulesToUpdate = [];
        const rulesToDelete = [];

        let conflictVolume;

        if (importStrategy !== ImportStrategy.NAIVE) {
            sameRules = _.intersectionWith(sourceRules,targetRules,RuleUtils.ruleIdComparator);
            sourceExtras = _.differenceWith(sourceRules,targetRules,RuleUtils.ruleIdComparator);
            targetExtras = _.differenceWith(targetRules,sourceRules,RuleUtils.ruleIdComparator);

            let targetRulesMap = new Map();
            targetRules.forEach((targetRule) => {
                targetRulesMap.set(RuleUtils.id(targetRule),targetRule);
            });

            conflictVolume = 0;

            sameRules.forEach((sourceRule) => {
                const targetRule = targetRulesMap.get(RuleUtils.id(sourceRule));

                if (!RuleUtils.ruleComparator(sourceRule,targetRule)) {
                    conflictVolume++;
                    switch (importStrategy) {
                        case ImportStrategy.NEW_VERSION: {
                            // Note that name or alias can change, which causes a discrepancy
                            // One could add a check for this, but maybe better not use this strategy
                            let lastVersion = 0;
                            for (const [id, rule] of targetRulesMap.entries()) {
                                const baseId = (id.split('_'))[0];
                                if (baseId === RuleUtils.baseId(sourceRule) && rule.version > lastVersion) {
                                    lastVersion = rule.version;
                                }
                            }
                            sourceRule.version = lastVersion+1;
                            sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags,MigrationTag.CONFLICT,this.traceId);
                            rulesToAdd.push(sourceRule);
                            break;
                        }
                        case ImportStrategy.NEW_RULE: {
                            sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags,MigrationTag.CONFLICT,this.traceId);
                            const ruleIdVariationLength = 12;
                            const naivelyTrimmedTraceId = this.traceId.slice(0,ruleIdVariationLength);
                            const trimmedTraceId = naivelyTrimmedTraceId + '-'.repeat(ruleIdVariationLength - naivelyTrimmedTraceId.length);
                            RuleUtils.updateBaseId(sourceRule,`${RuleUtils.baseId(sourceRule).slice(0, 36-ruleIdVariationLength )}${trimmedTraceId}`);
                            rulesToAdd.push(sourceRule);
                            break;
                        }
                        case ImportStrategy.FORCE_PUSH: {
                            sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags,MigrationTag.UPDATED,this.traceId);
                            rulesToUpdate.push(sourceRule);
                            break;
                        }
                        case ImportStrategy.FORCE_IMPOSE: {
                            sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags,MigrationTag.UPDATED,this.traceId);
                            rulesToUpdate.push(sourceRule);
                            break;
                        }
                        default: {}
                    }
                }
            });

            sourceExtras.forEach((sourceRule) => {
                sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags,MigrationTag.ADDED,this.traceId);
                rulesToAdd.push(sourceRule);
            })

            targetExtras.forEach((targetRule) => {
                if (importStrategy === ImportStrategy.FORCE_IMPOSE) {
                    rulesToDelete.push(targetRule);
                } else {
                    targetRule.tags = RuleUtils.updateMigrationTags(targetRule.tags,MigrationTag.EXTRA,this.traceId);
                    rulesToUpdate.push(targetRule);
                }
            })
        } else {
            rulesToAdd = sourceRules;
        }

        const stats = {
            sourceVolume: sourceRules?.length ?? '?',
            targetVolume: targetRules?.length ?? '?',
            sourceExtraVolume: sourceExtras?.length ?? '?',
            targetExtraVolume: targetExtras?.length ?? '?',
            intersectionVolume: sameRules?.length ?? '?',
            conflictVolume: conflictVolume ?? '?',
            addedVolume: rulesToAdd?.length ?? '?',
            updatedVolume: rulesToUpdate?.length ?? '?',
            deletedVolume: rulesToDelete?.length ?? '?'
        }

        return [
            rulesToAdd,
            rulesToUpdate,
            rulesToDelete,
            stats
        ]
    }

    getEnvironment(env) {
        const environments = this.config?.environments;
        if (!environments) {
            throw new Error(`Config file [${this.configFileName}] missing the environments property`);
        }
        const environment = environments[env];
        if (!environment) {
            throw new Error(`Environment [${env}] not found in config file [${this.configFileName}]`);
        }
        environment.name = env;
        return environment;
    }

}
