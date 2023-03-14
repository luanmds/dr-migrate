import {ImportStrategy} from "../src/utils/models.js";
import {Migration} from "../src/migration.js";
import {PackageJson} from "./index.js";


export const importCommand = {
    command: 'import',
    describe: 'Import rules to given target environment',
    builder: (yargs) => {
        return yargs
            .option('id', {describe: 'Identifier of the operation', type: 'string', required: true})
            .option('env', {describe: 'Environment defined in your config file', type: 'string', required: true})
            .option('strategy', {
                describe: `Import strategy`,
                type: 'string',
                default: ImportStrategy.DRY_RUN,
                choices: Object.keys(ImportStrategy)
            })
            .option('config', {describe: 'Config file name', type: 'string', default: 'config.json'})
            .option('verbose', {describe: 'Write extensive log in the console', type: 'boolean', boolean: true})
            .example(`${PackageJson.name} import --id=ABC123 --env=production --strategy=NEW_RULE`)
            .example(`${PackageJson.name} import --id=ABC123 --env=production --config=config-alt.json`)
    },
    handler: async (argv) => {
        const migration = new Migration(argv.id, argv.config, argv.verbose);
        await migration.init();
        await migration.importRules(argv.env, argv.strategy);
    }
}


