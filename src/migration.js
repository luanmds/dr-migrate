import { ImportStrategy, ImportRuleFlowStrategy, MigrationTag } from "./utils/models.js";
import _ from "lodash";
import chalk from "chalk";
import { AccessUtils } from "./utils/accessUtils.js";
import { RuleUtils } from "./utils/ruleUtils.js";
import { MigrationUtils } from "./utils/migrationUtils.js";


export class Migration {

    configFileName;
    config;
    traceId;
    debug;

    constructor(traceId, configFileName, debug = false) {
        this.configFileName = configFileName;
        this.traceId = traceId;
        this.debug = debug;
    }

    async init() {
        this.config = await AccessUtils.readConfigFile(this.configFileName);
    }

    exportOptions(includeTags, excludeTags) {
        if (includeTags || excludeTags) {
            return {
                includeTags: includeTags ?? null,
                excludeTags: excludeTags ?? null
            }
        }
        return null;
    }

    startMigration(source, target, importStrategy) {
        console.info(chalk.blue(`[${this.traceId}] Migration from [${source}] to [${target}] with strategy ${importStrategy} started\n`));
    }

    async exportRules(env, includeTags, excludeTags) {
        try {
            console.info(chalk.blue(`[${this.traceId}] Export from [${env}] started`));
            const source = this.getEnvironment(env);
            const exportOptions = this.exportOptions(includeTags, excludeTags);

            if (this.debug) {
                const exportOptionsLog = exportOptions === null ? 'not specified' : JSON.stringify(exportOptions);
                console.info(chalk.blue(`[${this.traceId}] Export options ${exportOptionsLog}`));
            }

            const sourceFileName = `rules_${this.traceId}_source`;

            console.info(chalk.blue(`[${this.traceId}] Going to export source`));
            await MigrationUtils.exportRulesToFile(source, exportOptions, sourceFileName, this.debug);

            console.info(chalk.blue(`[${this.traceId}] Source exported to file [${sourceFileName}]`));

            const sourceRules = await AccessUtils.readRulesFromFile(sourceFileName);
            console.info(chalk.blue(`[${this.traceId}] Export complete!`));
            console.info(chalk.blue(`[${this.traceId}] Visible EXPORTED volume: ${sourceRules.length}\n`));
        } catch (e) {
            console.error(chalk.red(`[${this.traceId}] Export from [${env}] errored`));
            console.error(chalk.red(`[${this.traceId}] ${e}\n`));
        }
    }

    async importRules(env, importStrategy) {
        let writePhase = false;
        try {
            const target = this.getEnvironment(env);
            this.importRulesValidator(importStrategy);

            console.info(chalk.blue(`[${this.traceId}] Import with strategy [${importStrategy}] to [${target.name}] started`));

            const sourceFileName = `rules_${this.traceId}_source`;
            const targetFileName = `rules_${this.traceId}_target`;

            const sourceRules = await AccessUtils.readRulesFromFile(sourceFileName);
            console.info(chalk.blue(`[${this.traceId}] Source recovered from file [${sourceFileName}]`));

            console.info(chalk.blue(`[${this.traceId}] Going to export target`));
            await MigrationUtils.exportRulesToFile(target, null, targetFileName, this.debug);
            const targetRules = await AccessUtils.readRulesFromFile(targetFileName);
            console.info(chalk.blue(`[${this.traceId}] Target exported to file [${targetFileName}]`));

            const [analysis, rulesToAdd, rulesToUpdate, rulesToDelete, stats] = this.mergeRules(sourceRules, targetRules, importStrategy, this.traceId);

            if (this.debug || importStrategy === ImportStrategy.DRY_RUN) {
                this.logAnalysis(analysis, importStrategy);
            }

            if (importStrategy !== ImportStrategy.DRY_RUN) {
                writePhase = true;
                console.info(chalk.blue(`[${this.traceId}] Running ----------------------------------------`));
                if (rulesToDelete.length > 0) {
                    console.info(chalk.blue(`[${this.traceId}] DELETE`));
                    await MigrationUtils.deleteRules(target, rulesToDelete, this.debug);
                    if (this.debug) {
                        console.info(chalk.blue(``));
                    }
                }
                if (rulesToAdd.length > 0) {
                    console.info(chalk.blue(`[${this.traceId}] ADD`));
                    await MigrationUtils.createRules(target, rulesToAdd, this.debug);
                    if (this.debug) {
                        console.info(chalk.blue(``));
                    }
                }
                if (rulesToUpdate.length > 0) {
                    console.info(chalk.blue(`[${this.traceId}] UPDATE`));
                    await MigrationUtils.updateRules(target, rulesToUpdate, this.debug);
                    if (this.debug) {
                        console.info(chalk.blue(``));
                    }
                }
            }

            this.importSuccessLog(stats);
        } catch (e) {
            this.importErrorLog(env, writePhase, e);
        }
    }
    
    /**
     * EXPORT AND IMPORT TO RULE FLOW
     */
    async exportRuleFlow(env, ruleFlowId, versionRuleFlow = null) {
        try {
            console.info(chalk.blue(`[RuleFlow Id:${this.traceId}] Export from [${env}] started`));
            const source = this.getEnvironment(env);

            const sourceFileName = `rule_flow_${ruleFlowId}_source`;

            console.info(chalk.blue(`[${this.traceId}] Going to export source`));

            await MigrationUtils.exportRuleFlowToFile(source, sourceFileName, ruleFlowId, versionRuleFlow);
            console.info(chalk.blue(`[${this.traceId}] Source exported to file [${sourceFileName}]`));

            const sourceRule = await AccessUtils.readRuleFlowFromFile(sourceFileName);
            console.info(chalk.blue(`[${this.traceId}] Export complete!`));
            console.info(chalk.blue(`[${this.traceId}] RuleFlow Name: ${sourceRule[0].name}`));
            console.info(chalk.blue(`[${this.traceId}] RuleFlow Version: ${sourceRule[0].version}\n`));
        } catch (e) {
            console.error(chalk.red(`[${this.traceId}] Export the RuleFlow ${ruleFlowId} from [${env}] errored`));
            console.error(chalk.red(`[${this.traceId}] ${e}\n`));
        }
    }

    async importRuleFlow(env, importRuleFlowStrategy, ruleFlowId) {
        let writePhase = false;
        
        const dryRunStrategies = [
            ImportRuleFlowStrategy.RULEFLOW_NEW_VERSION_DRY_RUN, 
            ImportRuleFlowStrategy.RULEFLOW_UPDATE_DRY_RUN, 
            ImportRuleFlowStrategy.RULEFLOW_UPDATE_DRY_RUN];
            
        const sourceFileName = `rule_flow_${this.traceId}_source`;
        const targetFileName = `rule_flow_${this.traceId}_target`;

        try {
            const target = this.getEnvironment(env);
            this.importRulesValidator(importRuleFlowStrategy);

            console.info(chalk.blue(`[${this.traceId}] Import with strategy [${importRuleFlowStrategy}] to [${target.name}] started`));           

            const sourceRule = await AccessUtils.readRuleFlowFromFile(sourceFileName);
            console.info(chalk.blue(`[${this.traceId}] Source recovered from file [${sourceFileName}]`));

            console.info(chalk.blue(`\n[${this.traceId}] Going to export target`));

            try {
                await MigrationUtils.exportRuleFlowToFile(target, targetFileName, ruleFlowId);
            } catch (e) { 
                // Case RuleFlow Not Found in target environment, create a empty json file
                if(JSON.parse(e.message).statusCode == 400) 
                    await AccessUtils.writeRulesToFile(targetFileName, [])
                else 
                    throw e;
            }

            const targetRule = await AccessUtils.readRuleFlowFromFile(targetFileName);
            console.info(chalk.blue(`[${this.traceId}] Target exported to file [${targetFileName}]\n`));

            if (this.debug || dryRunStrategies.includes(importRuleFlowStrategy)) {
                console.info(chalk.blue(`\n[${this.traceId}] Analysis the import (${importRuleFlowStrategy}) ---------------------------------------`));
                
                if(importRuleFlowStrategy == ImportRuleFlowStrategy.RULEFLOW_UPDATE_DRY_RUN) {
                    console.info(chalk.blue(`\n[${this.traceId}] UPDATE RULEFLOW`)); 
                    console.info(chalk.blue(`[${this.traceId}] ${sourceRule[0].compositionId} SOURCE`));
                    console.info(chalk.blue(`[${this.traceId}] ${targetRule?.indexOf(0).compositionId} TARGET`));
                }

                if(importRuleFlowStrategy == ImportRuleFlowStrategy.RULEFLOW_NEW_VERSION_DRY_RUN) {
                    console.info(chalk.blue(`[${this.traceId}] DELETE RULEFLOW OLD VERSION`));
                    console.info(chalk.blue(`[${this.traceId}] ${targetRule?.indexOf(0).compositionId} TARGET`));                                        

                    console.info(chalk.blue(`[${this.traceId}] ADD RULEFLOW NEW VERSION`));
                    console.info(chalk.blue(`[${this.traceId}] ${sourceRule[0].compositionId} SOURCE`));                    
                }

                if(importRuleFlowStrategy == ImportRuleFlowStrategy.RULEFLOW_NEW_RULE_DRY_RUN) {
                    console.info(chalk.blue(`[${this.traceId}] ADD NEW RULEFLOW`));
                    console.info(chalk.blue(`[${this.traceId}] ${sourceRule[0].compositionId} SOURCE`));                    
                }
            }
            
            if (!dryRunStrategies.includes(importRuleFlowStrategy) ) {
                writePhase = true;
                console.info(chalk.blue(`[${this.traceId}] Running the import to Environment ${target.name} ----------------------------------------`));

                switch(importRuleFlowStrategy) {
                    case ImportRuleFlowStrategy.RULEFLOW_UPDATE:
                        console.info(chalk.blue(`[${this.traceId}] UPDATE RULEFLOW`));  
                        
                        if (targetRule.length == 0 || sourceRule[0].version != targetRule[0].version)
                            throw new Error(`Rule flow does not exist in the target or the version is different in the source and target environments!`);

                        await MigrationUtils.deleteRules(target, sourceRule, true, true);
                        await MigrationUtils.createRules(target, sourceRule, true);
                        break; 
                    case ImportRuleFlowStrategy.RULEFLOW_NEW_VERSION:
                        console.info(chalk.blue(`[${this.traceId}] ADD NEW VERSION TO RULEFLOW`));

                        if (sourceRule[0].version == targetRule[0].version)
                            throw new Error(`Rule flow in source and target environments have the same version: ${targetRule[0].version}!`);

                        await MigrationUtils.deleteRules(target, sourceRule, true, true);
                        await MigrationUtils.createRules(target, sourceRule, true);
                        break;
                    case ImportRuleFlowStrategy.RULEFLOW_NEW_RULE:
                        console.info(chalk.blue(`[${this.traceId}] ADD NEW RULEFLOW`));    

                        if (targetRule.length > 0) throw new Error(`Rule flow exists in the target environment!`);
                        await MigrationUtils.createRules(target, sourceRule, true);
                        break;
                    default:
                        break;
                }
            }
            console.info(chalk.blue(` `));
            console.info(chalk.greenBright(`[${this.traceId}] Import completed with Strategy: ${importRuleFlowStrategy}!`));
        } catch (e) {     
            AccessUtils.deleteRulesToFile(targetFileName)       
            this.importErrorLog(env, writePhase, e);
        }
    } 

    importRulesValidator(importStrategy) {
        if (Object.values(ImportStrategy).indexOf(importStrategy) === -1 &&  Object.values(ImportRuleFlowStrategy).indexOf(importStrategy) === -1) {
            throw new Error(`Invalid import strategy [${importStrategy}]`);
        }
    }

    importSuccessLog(stats) {
        console.info(chalk.blue(`[${this.traceId}] Import complete!`));
        console.info(chalk.blue(`[${this.traceId}] Visible volume of SOURCE / TARGET before the import:      ${stats.sourceVolume} / ${stats.targetVolume}`));
        console.info(chalk.blue(`[${this.traceId}] SOURCE EXTRA / SAME (CONFLICTS) / TARGET EXTRA:           ${stats.sourceExtraVolume} / ${stats.intersectionVolume} (${stats.conflictVolume}) / ${stats.targetExtraVolume}`));
        console.info(chalk.blue(`[${this.traceId}] ADDED TO TARGET / UPDATED IN TARGET / DELETED IN TARGET:  ${stats.addedVolume} / ${stats.updatedVolume} / ${stats.deletedVolume}\n`));
    }

    importErrorLog(env, writePhase, e) {
        console.error(chalk.red(`[${this.traceId}] Import errored`));
        console.error(chalk.red(`[${this.traceId}] ${e}`));
        if (writePhase) {
            console.error(chalk.red(`[${this.traceId}] Please check target [${env}] for potential inconsistencies\n`));
        } else {
            console.error(chalk.red(`[${this.traceId}] Import aborted before write operations, target [${env}] not affected\n`));
        }
    }

    logAnalysis(analysis, importStrategy) {
        console.info(chalk.blue(`\n[${this.traceId}] Analysis ---------------------------------------`));

        if (importStrategy === ImportStrategy.NAIVE) {
            console.info(chalk.blue(`[${this.traceId}] The used NAIVE strategy does not perform any analysis\n`));
            return;
        }

        console.info(chalk.blue(`[${this.traceId}] SOURCE EXTRAS`));
        if (analysis.sourceExtras.length === 0) {
            console.info(chalk.blue(`None`));
        }
        for (let rule of analysis.sourceExtras) {
            MigrationUtils.logRule(rule);
        }
        console.info(chalk.blue(`\n[${this.traceId}] SAME RULES`));
        if (analysis.sameRules.length === 0) {
            console.info(chalk.blue(`None`));
        }
        for (let rule of analysis.sameRules) {
            MigrationUtils.logRule(rule);
        }
        console.info(chalk.blue(`\n[${this.traceId}] CONFLICTS`));
        if (analysis.conflicts.length === 0) {
            console.info(chalk.blue(`None`));
        }
        for (let conflict of analysis.conflicts) {
            MigrationUtils.logRule(conflict.inSource, 'SOURCE');
            MigrationUtils.logRule(conflict.inTarget, 'TARGET');
        }
        console.info(chalk.blue(`\n[${this.traceId}] TARGET EXTRAS`));
        if (analysis.targetExtras.length === 0) {
            console.info(chalk.blue(`None`));
        }
        for (let rule of analysis.targetExtras) {
            MigrationUtils.logRule(rule);
        }
        console.info(chalk.blue(``));
    }

    mergeRules(sourceRules, targetRules, importStrategy) {

        let sameRules;
        let sourceExtras;
        let targetExtras;

        let conflicts = [];
        let rulesToAdd = [];
        const rulesToUpdate = [];
        const rulesToDelete = [];

        let conflictVolume;

        if (importStrategy !== ImportStrategy.NAIVE) {
            sameRules = _.intersectionWith(sourceRules, targetRules, RuleUtils.ruleIdComparator);
            sourceExtras = _.differenceWith(sourceRules, targetRules, RuleUtils.ruleIdComparator);
            targetExtras = _.differenceWith(targetRules, sourceRules, RuleUtils.ruleIdComparator);

            let targetRulesMap = new Map();
            targetRules.forEach((targetRule) => {
                targetRulesMap.set(RuleUtils.id(targetRule), targetRule);
            });

            conflictVolume = 0;

            sameRules.forEach((sourceRule) => {
                const targetRule = targetRulesMap.get(RuleUtils.id(sourceRule));

                if (!RuleUtils.ruleComparator(sourceRule, targetRule)) {
                    conflictVolume++;
                    conflicts.push({
                        inSource: sourceRule,
                        inTarget: targetRule
                    });

                    switch (importStrategy) {
                        case ImportStrategy.DRY_RUN: {
                            // We do nothing
                            break;
                        }
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
                            sourceRule.version = lastVersion + 1;
                            sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags, MigrationTag.CONFLICT, this.traceId);
                            rulesToAdd.push(sourceRule);
                            break;
                        }
                        case ImportStrategy.NEW_RULE: {
                            // This may break processes in the target if rules are called by alias because the alias will be duplicate
                            sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags, MigrationTag.CONFLICT, this.traceId);
                            const ruleIdVariationLength = 12;
                            const naivelyTrimmedTraceId = this.traceId.slice(0, ruleIdVariationLength);
                            const trimmedTraceId = naivelyTrimmedTraceId + '-'.repeat(ruleIdVariationLength - naivelyTrimmedTraceId.length);
                            RuleUtils.updateBaseId(sourceRule, `${RuleUtils.baseId(sourceRule).slice(0, 36 - ruleIdVariationLength)}${trimmedTraceId}`);
                            rulesToAdd.push(sourceRule);
                            break;
                        }
                        case ImportStrategy.CAREFUL: {
                            // Do nothing with the conflict
                            break;
                        }
                        case ImportStrategy.FORCE_PUSH: {
                            sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags, MigrationTag.UPDATED, this.traceId);
                            rulesToUpdate.push(sourceRule);
                            break;
                        }
                        case ImportStrategy.FORCE_IMPOSE: {
                            sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags, MigrationTag.UPDATED, this.traceId);
                            rulesToUpdate.push(sourceRule);
                            break;
                        }
                        default: { }
                    }
                }
            });

            if (importStrategy !== ImportStrategy.DRY_RUN) {
                sourceExtras.forEach((sourceRule) => {
                    sourceRule.tags = RuleUtils.updateMigrationTags(sourceRule.tags, MigrationTag.ADDED, this.traceId);
                    rulesToAdd.push(sourceRule);
                })

                targetExtras.forEach((targetRule) => {
                    if (importStrategy === ImportStrategy.FORCE_IMPOSE) {
                        rulesToDelete.push(targetRule);
                    } else {
                        targetRule.tags = RuleUtils.updateMigrationTags(targetRule.tags, MigrationTag.EXTRA, this.traceId);
                        rulesToUpdate.push(targetRule);
                    }
                })
            }
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

        const analysis = {
            sameRules,
            sourceExtras,
            targetExtras,
            conflicts
        }

        return [
            analysis,
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
