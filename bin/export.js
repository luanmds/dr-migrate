import {Migration} from "../src/migration.js";
import {PackageJson} from "./index.js";


export const exportCommand = {
    command: 'export',
    describe: 'Export rules from given source environment',
    builder: (yargs) => {
        return yargs
            .option('id', {describe: 'Identifier of the operation', type: 'string', required: true})
            .option('env', {describe: 'Environment defined in your config file', type: 'string', required: true})
            .option('includeTags', {describe: 'Include rules with one of these tags', type: 'array'})
            .option('excludeTags', {describe: 'Exclude rules with one of these tags', type: 'array'})
            .option('config', {describe: 'Config file name', type: 'string', default: 'config.json'})
            .option('verbose', {describe: 'Write extensive log in the console', type: 'boolean', default: false})
            .example(`${PackageJson.name} export --id=ABC123 --env=staging --excludeTags=Hidden`)
            .example(`${PackageJson.name} export --id=ABC123 --env=staging --includeTags="Proc A" "Proc B"`)
            .example(`${PackageJson.name} export --id=ABC123 --env=staging --config=config-alt.json`)
    },
    handler: async (argv) => {
        const migration = new Migration(argv.id, argv.config, argv.verbose);
        await migration.init();
        await migration.exportRules(argv.env, argv.includeTags, argv.excludeTags);
    }
}
