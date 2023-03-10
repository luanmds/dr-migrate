import {promises as fs} from "fs";
import {ConfigSample} from "./models.js";
import chalk from "chalk";
import axios from 'axios';


export class AccessUtils {

    static async callManagementApi(method, environment, path, data = null) {
        try {
            const eUrl = (' ' + environment.url).slice(1);
            if (eUrl.charAt(environment.url.length - 1) === "/") {
                eUrl.slice(-1);
            }
            const config = {
                url: eUrl + path,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + environment.managementApiKey
                }
            }
            if (data) {
                config.data = data;
            }
            const res = await axios.request(config);
            if (res.data) {
                return res.data;
            }
            return null;
        } catch (e) {
            if (e.response.data) {
                throw new Error(e.response.data);
            }
            throw e;
        }
    }

    static async readRulesFromFile(fileName) {
        const rulesFromFile = await fs.readFile(`tmp/${fileName}.json`, 'utf8');
        const rules = JSON.parse(rulesFromFile);
        if (!Array.isArray(rules)) {
            throw new Error(`Reading rules from file [${fileName}] failed, did not get array`);
        }
        return rules;
    }

    static async writeRulesToFile(fileName,data) {
        await AccessUtils.prepareTmpDir();
        try {
            await fs.access(`tmp/${fileName}.json`);
        } catch (error) {
            const dataString = JSON.stringify(data);
            return await fs.writeFile(`tmp/${fileName}.json`, dataString);
        }
        throw new Error(`File [${fileName}] already exists. Use different id`);
    }

    static async prepareTmpDir() {
        const tmp = './tmp';
        try {
            await fs.access(tmp);
        } catch (error) {
            await fs.mkdir(tmp);
        }
    }

    static async createConfig() {
        try {
            await fs.access(`config.json`);
        } catch (error) {
            const dataString = JSON.stringify(ConfigSample,null,"\t");
            return await fs.writeFile(`config.json`, dataString);
        }
        throw new Error(`Config file [config.json] already exists`);
    }

    static async readConfigFile(fileName) {
        try {
            const configFromFile = await fs.readFile(`${fileName ? fileName : 'config.json'}`, 'utf8');
            return JSON.parse(configFromFile);
        } catch (e) {
            console.error(chalk.red(`Cannot read config file [${fileName}]\n`));
        }
    }
}