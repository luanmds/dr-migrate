import {Migration} from "../../src/migration.js";
import {PackageJson} from "../index.js";


export const exportRuleFlowCommand = {
    command: 'export-rule',
    describe: 'Export a Rule Flow from given source environment',
    builder: (yargs) => {
        return yargs
            .option('ruleId', {describe: 'RuleFlow identifier in source to export', type: 'string', required: true})
            .option('ruleVersion', {describe: 'RuleFlow version in source to export. If not set, get the latest version of the ruleflow', type: 'string'})
            .option('env', {describe: 'Environment defined in your config file', type: 'string', required: true})
            .option('config', {describe: 'Config file name', type: 'string', default: 'config.json'})
            .option('verbose', {describe: 'Write extensive log in the console', type: 'boolean', boolean: true})
            .example(`${PackageJson.name} export --ruleId=ABC123 --env=staging --verbose=true`)
            .example(`${PackageJson.name} export --ruleId=ABC123 --env=staging --ruleVersion=2 --verbose=true`)
            .example(`${PackageJson.name} export --ruleId=ABC123 --env=staging --config=config-alt.json --verbose=true`)
    },
    handler: async (argv) => {
        const migration = new Migration(argv.ruleId, argv.config, argv.verbose);
        await migration.init();
        await migration.exportRuleFlow(argv.env, argv.ruleId, argv.ruleVersion);
    }
}
