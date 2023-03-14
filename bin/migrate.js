import {ImportStrategy} from "../src/utils/models.js";
import {Migration} from "../src/migration.js";
import {PackageJson} from "./index.js";


export const migrateCommand = {
    command: 'migrate',
    describe: 'Migrate rules from source to target in one command',
    builder: (yargs) => {
        return yargs
            .option('id', {describe: 'Identifier of the operation', type: 'string', required: true})
            .option('source', {describe: 'Environment defined in your config file', type: 'string', required: true})
            .option('target', {describe: 'Environment defined in your config file', type: 'string', required: true})
            .option('includeTags', { describe: 'Include rules with one of these tags', type: 'array' })
            .option('excludeTags', { describe: 'Exclude rules with one of these tags', type: 'array' })
            .option('strategy', {
                describe: `Import strategy`,
                type: 'string',
                default: ImportStrategy.DRY_RUN,
                choices: Object.keys(ImportStrategy)
            })
            .option('config', {describe: 'Config file name', type: 'string', default: 'config.json'})
            .option('verbose', {describe: 'Write extensive log in the console', type: 'boolean', boolean: true})
            .example(`${PackageJson.name} migrate --id=ABC123 --source=staging --target=production --strategy=NEW_RULE`)
            .example(`${PackageJson.name} migrate --id=ABC123 --source=staging --target=production --excludeTags=Hidden`)
            .example(`${PackageJson.name} migrate --id=ABC123 --source=staging --target=production --config=config-alt.json`)
    },
    handler: async (argv) => {
        const migration = new Migration(argv.id, argv.config, argv.verbose);
        await migration.init();
        await migration.exportRules(argv.source,argv.includeTags,argv.excludeTags);
        await migration.importRules(argv.target,argv.strategy);
    }
}

