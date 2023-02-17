#!/usr/bin/env node

import {readFile} from 'fs/promises';
import chalk from "chalk";
import {ImportStrategyDescription} from "../src/utils/models.js";

import {exportCommand} from './export.js'
import {importCommand} from './import.js'
import {migrateCommand} from './migrate.js'

import yargs from "yargs";
const _yargs = yargs(process.argv.slice(2));


export const PackageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
console.info(chalk.magenta(`\ndr-migrate version ${PackageJson.version}\n`));

const strategiesCommand = {
    command: 'strategies',
    describe: 'List supported import strategies',
    handler() {
        console.info(chalk.magenta(`List of supported import strategies:\n`));
        for (const [strategy, description] of Object.entries(ImportStrategyDescription)) {
            console.info(chalk.magenta(`   ${strategy}`) + `: ${description}`);
        }
        console.info(``);
    }
};

const commands = [exportCommand, importCommand, migrateCommand, strategiesCommand];

function showHelp() {
    console.info(chalk.magenta(`Use one of the supported commands:\n`));
    for (const command of commands) {
        console.info(chalk.magenta(`   ${command.command}`) + `: ${command.describe}`);
    }
    console.info(``);
}

const defaultCommand = {
    command: '*',
    describe: 'Show available commands',
    handler() {
        // _yargs.showHelp()
        showHelp();
    }
};


/**
 * Command definitions
 */
_yargs.command(exportCommand);
_yargs.command(importCommand);
_yargs.command(migrateCommand);
_yargs.command(strategiesCommand);
_yargs.command(defaultCommand);

// Not needed
// _yargs.help().alias({help: ['h','?']});
_yargs.help(false);
_yargs.version(false);

const argv = _yargs.argv

