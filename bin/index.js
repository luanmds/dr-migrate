#!/usr/bin/env node

import {readFile} from 'fs/promises';
import chalk from "chalk";
import {ImportStrategyDescription} from "../src/utils/models.js";

import {exportCommand} from './export.js'
import {importCommand} from './import.js'
import {exportRuleFlowCommand} from './rule-flow/exportRuleFlow.js'
import {importRuleFlowCommand} from './rule-flow/importRuleFlow.js'
import {migrateCommand} from './migrate.js'
import {migrateRuleFlowCommand} from './migrateRuleFlow.js';

import yargs from "yargs";
import {AccessUtils} from "../src/utils/accessUtils.js";

const _yargs = yargs(process.argv.slice(2));


export const PackageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
console.info(chalk.blue(`\ndr-migrate version ${PackageJson.version}\n`));

const initCommand = {
    command: 'init',
    describe: 'Create sample config file',
    async handler() {
        try {
            await AccessUtils.createConfig();
            console.info(chalk.blue(`Config file created, check the directory where you are running me\n`));
        } catch (e) {
            console.info(chalk.blue(`Config file [config.json] already exists\n`));
        }
    }
};

const strategiesCommand = {
    command: 'strategies',
    describe: 'List supported import strategies',
    handler() {
        console.info(chalk.blue(`List of supported import strategies:\n`));
        for (const [strategy, description] of Object.entries(ImportStrategyDescription)) {
            console.info(chalk.blue(`   ${strategy}`) + `: ${description}`);
        }
        console.info(``);
    }
};

const strategiesRuleFlowCommand = {
    command: 'strategies-ruleflow',
    describe: 'List supported import RuleFlow strategies',
    handler() {
        console.info(chalk.blue(`List of supported import RuleFlow strategies:\n`));
        for (const [strategy, description] of Object.entries(ImportRuleFlowStrategyDescription)) {
            console.info(chalk.blue(`   ${strategy}`) + `: ${description}`);
        }
        console.info(``);
    }
};

const commands = [initCommand, exportCommand, importCommand, migrateCommand, strategiesCommand, migrateRuleFlowCommand,exportRuleFlowCommand, importRuleFlowCommand, strategiesRuleFlowCommand];

function showHelp() {
    console.info(chalk.blue(`Use one of the supported commands:\n`));
    for (const command of commands) {
        console.info(chalk.blue(`   ${command.command}`) + `: ${command.describe}`);
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
_yargs.command(initCommand);
_yargs.command(exportCommand);
_yargs.command(importCommand);
_yargs.command(exportRuleFlowCommand);
_yargs.command(importRuleFlowCommand);
_yargs.command(migrateCommand);
_yargs.command(migrateRuleFlowCommand);
_yargs.command(strategiesCommand);
_yargs.command(strategiesRuleFlowCommand);
_yargs.command(defaultCommand);

// Not needed
// _yargs.help().alias({help: ['h','?']});
_yargs.help(false);
_yargs.version(false);

const argv = _yargs.argv

