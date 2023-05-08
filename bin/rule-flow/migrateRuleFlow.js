import {ImportRuleFlowStrategy} from "../src/utils/models.js";
import {Migration} from "../src/migration.js";
import {PackageJson} from "./index.js";


export const migrateRuleFlowCommand = {
    command: 'migrate-rule',
    describe: 'Migrate a Rule Flow from source to target in one command',
    builder: (yargs) => {
        return yargs
            .option('ruleId', {describe: 'RuleFlow identifier in source to export', type: 'string', required: true})
            .option('ruleVersion', {describe: 'RuleFlow version in source to export. If not set, get the latest version of the ruleflow', type: 'string'})
            .option('source', {describe: 'Environment defined in your config file', type: 'string', required: true})
            .option('target', {describe: 'Environment defined in your config file', type: 'string', required: true})
            .option('strategy', {
                describe: `Import strategy`,
                type: 'string',
                default: ImportRuleFlowStrategy.RULEFLOW_NEW_RULE_DRY_RUN,
                choices: Object.keys(ImportRuleFlowStrategy)
            })
            .option('config', {describe: 'Config file name', type: 'string', default: 'config.json'})
            .option('verbose', {describe: 'Write extensive log in the console', type: 'boolean', boolean: true})
            .example(`${PackageJson.name} migrate-rule --id=ABC123 --source=staging --target=production --strategy=NEW_RULE`)
            .example(`${PackageJson.name} migrate-rule --id=ABC123 --source=staging --target=production --excludeTags=Hidden`)
            .example(`${PackageJson.name} migrate-rule --id=ABC123 --source=staging --target=production --config=config-alt.json`)
    },
    handler: async (argv) => {
        const migration = new Migration(argv.ruleId, argv.config, argv.verbose);
        await migration.init();

        migration.startMigration(argv.source,argv.target,argv.strategy);
        await migration.exportRuleFlow(argv.source, argv.ruleId, argv.ruleVersion);
        await migration.importRuleFlow(argv.target, argv.strategy, argv.ruleId);
    }
}

