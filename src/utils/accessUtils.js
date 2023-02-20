import https from "https";
import http from "http";
import {promises as fs} from "fs";
import {ConfigSample, Methods} from "./models.js";
import chalk from "chalk";


export class AccessUtils {

    static async callManagementApi(method, environment, path, data = null) {
        const port = environment.port === 443 ? https : http;
        const options = {
            host: environment.host,
            port: environment.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + environment.managementApiKey
            }
        };
        return new Promise((resolve, reject) => {
            let output = '';
            const req = port.request(options, (res) => {
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    output += chunk;
                });
                res.on('end', () => {
                    try {
                        let obj = JSON.parse(output);
                        resolve(obj);
                    } catch {
                        if (method === Methods.GET) {
                            reject(output);
                        }
                        resolve(output);
                    }
                });
            });

            if (data) {
                const dataString = JSON.stringify(data);
                req.write(dataString);
            }

            req.on('error', (e) => {
                reject(e);
            });
            req.end();
        });
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