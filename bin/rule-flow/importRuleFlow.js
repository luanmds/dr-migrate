import {ImportRuleFlowStrategy} from "../src/utils/models.js";
import {Migration} from "../src/migration.js";
import {PackageJson} from "./index.js";


export const importRuleFlowCommand = {
    command: 'import-rule',
    describe: 'Import a Rule Flow to given target environment',
    builder: (yargs) => {
        return yargs
            .option('ruleId', {describe: 'Rule Flow Identifier in target to import', type: 'string', required: true})
            .option('env', {describe: 'Environment defined in your config file', type: 'string', required: true})
            .option('strategy', {
                describe: `Import strategy`,
                type: 'string',
                default: ImportRuleFlowStrategy.RULEFLOW_UPDATE_DRY_RUN,
                choices: Object.keys(ImportRuleFlowStrategy)
            })
            .option('config', {describe: 'Config file name', type: 'string', default: 'config.json'})
            .option('verbose', {describe: 'Write extensive log in the console', type: 'boolean', boolean: true})
            .example(`${PackageJson.name} import-rule --ruleId=ABC123 --env=production --strategy=RULEFLOW_NEW_VERSION`)
            .example(`${PackageJson.name} import-rule --ruleId=ABC123 --env=production --config=config-alt.json`)
    },
    handler: async (argv) => {
        const migration = new Migration(argv.ruleId, argv.config, argv.verbose, argv.ruleId);
        await migration.init();
        await migration.importRuleFlow(argv.env, argv.strategy, argv.ruleId);
    }
}


