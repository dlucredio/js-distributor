// External imports
import path from "path";
import fs from "fs";
import yaml from "js-yaml";

// Internal imports
import helpers from '../helpers/GenericHelpers.js';

let instance = null;

class ConfigSingleton {
    constructor(configFile) {
        this.yamlPath = path.resolve(configFile);
    }

    getYamlContent() {
        const yamlContent = yaml.load(fs.readFileSync(this.yamlPath, 'utf8'));

        // Basic validation

        // Let's resolve the folders relative to the path of the config file
        yamlContent.codeGenerationParameters.inputFolder = path.resolve(path.join(getConfigPath(), yamlContent.codeGenerationParameters.inputFolder));
        yamlContent.codeGenerationParameters.outputFolder = path.resolve(path.join(getConfigPath(), yamlContent.codeGenerationParameters.outputFolder));
        // inputFolder exists? If not, raise error
        if (!fs.existsSync(yamlContent.codeGenerationParameters.inputFolder) || !fs.lstatSync(yamlContent.codeGenerationParameters.inputFolder).isDirectory()) {
            throw new ConfigError(`Error: inputFolder "${yamlContent.codeGenerationParameters.inputFolder}" does not exist or is not a directory`);
        } 

        if(!yamlContent.codeGenerationParameters.mode) {
            yamlContent.codeGenerationParameters.mode = "single";
        } else if(yamlContent.codeGenerationParameters.mode !== "single" && yamlContent.codeGenerationParameters.mode !== "watch") {
            throw new ConfigError(`Error: config.yml property "codeGenerationParameters.mode should be either "single" or "watch"`);
        }

        if(!yamlContent.codeGenerationParameters.ignore) {
            yamlContent.codeGenerationParameters.ignore = []
        }
        
        if(!Array.isArray(yamlContent.codeGenerationParameters.ignore)) {
            throw new ConfigError(`Error: config.yml property "codeGenerationParameters.ignore should be a list`);
        }

        if(!yamlContent.rabbitParameters) {
            yamlContent.rabbitParameters = {}
        }

        if(!yamlContent.rabbitParameters.url) {
            yamlContent.rabbitParameters.url = "localhost";
        }

        if(!yamlContent.rabbitParameters.port) {
            yamlContent.rabbitParameters.port = 5672;
        }

        if(!yamlContent.rabbitParameters.numConnectionAttempts) {
            yamlContent.rabbitParameters.numConnectionAttempts = 5;
        }

        if(!yamlContent.rabbitParameters.timeBetweenAttempts) {
            yamlContent.rabbitParameters.timeBetweenAttempts = 10;
        }


        // Let's add the defaults and do some validation/preparation
        // - Lowercase function methods
        // - Check for valid methods
        const validMethods = ['http-get', 'http-post', 'rabbit'];
        for (const serverInfo of yamlContent.servers) {
            // Every server must have a genFolder
            // If none is specified, we leave it empty
            if (!serverInfo.genFolder) {
                serverInfo.genFolder = '';
            }
            if (!helpers.isIterable(serverInfo.functions)) {
                serverInfo.functions = [];
            }
            // Every function must have a method
            // If none is specified, we use 'http-get'
            // And it must have a list of call patterns
            // If there is none, we copy from the declarationPattern
            // And if must have a rabbit_config (for RabbitMQ)
            // If there is none, we create and check some default values
            for (const functionInfo of serverInfo.functions) {
                if (!functionInfo.method) {
                    functionInfo.method = 'http-get';
                } else {
                    functionInfo.method = functionInfo.method.toLowerCase();
                    if (!validMethods.includes(functionInfo.method)) {
                        throw new ConfigError(`Error: function ${functionInfo.declarationPattern} in server ${serverInfo.id} has invalid method: ${functionInfo.method}`);
                    }
                }
                if (!helpers.isIterable(functionInfo.callPatterns)) {
                    functionInfo.callPatterns = [functionInfo.declarationPattern];
                }
                if (!functionInfo.rabbitConfig) {
                    functionInfo.rabbitConfig = {
                        queue: null,
                        exchangeType: null,
                        exchangeName: null,
                        routingKey: null,
                        callbackQueue: null,
                        hasReturn: true
                    }
                }
                if(!functionInfo.rabbitConfig.exchangeType) {
                    functionInfo.rabbitConfig.exchangeType = "fanout"
                }
                if(!functionInfo.rabbitConfig.routingKey) {
                    functionInfo.rabbitConfig.routingKey = ""
                }
                if(!functionInfo.rabbitConfig.callbackQueue) {
                    functionInfo.rabbitConfig.callbackQueue = "anonymous"
                }
                if (functionInfo.rabbitConfig.hasReturn === undefined) {
                    functionInfo.rabbitConfig.hasReturn = true;
                }
            }
        }

        return yamlContent;
    }
}

function init(configFile) {
    if (instance) {
        throw new ConfigError("Configuration already initialized.");
    }
    instance = new ConfigSingleton(configFile);
};

export class ConfigError extends Error {
    constructor(message) {
        super(message);
    }
}

function getConfigPath() {
    if(!instance) {
        throw new ConfigError("Configuration not initialized. Use config.init(configFile) first.");
    }
    return path.dirname(instance.yamlPath);
}

function getCodeGenerationParameters() {
    if (!instance) {
        throw new ConfigError("Configuration not initialized. Use config.init(configFile) first.");
    }
    const yamlContent = instance.getYamlContent();
    return yamlContent.codeGenerationParameters;
}

// TODO: modify this to rely not only on functionName, but also
// other information, such as path, so that we can have more
// than one function with the same name
function getServerInfo(functionName) {
    if (!instance) {
        throw new ConfigError("Configuration not initialized. Use config.init(configFile) first.");
    }
    const yamlContent = instance.getYamlContent();
    const servers = yamlContent.servers;
    const ret = [];
    for (const s of servers) {
        const functions = s.functions;
        if (functions) {
            for (const f of functions) {
                if (matchPatternWithText(f.declarationPattern, functionName)) {
                    ret.push([f.declarationPattern, s]);
                }
            }
        }
    }

    if (ret.length == 0) {
        return null;
    }
    return getMoreSpecificPattern(ret);
}

// TODO: modify this to rely not only on functionName, but also
// other information, such as path, so that we can have more
// than one function with the same name
function getFunctionInfo(serverInfo, functionName) {
    if (!instance) {
        throw new ConfigError("Configuration not initialized. Use config.init(configFile) first.");
    }
    const ret = [];
    const functions = serverInfo.functions;
    if (functions) {
        for (const f of functions) {
            if (matchPatternWithText(f.declarationPattern, functionName)) {
                ret.push([f.declarationPattern, f]);
            }
        }
    }
    if (ret.length == 0) {
        return null;
    }
    return getMoreSpecificPattern(ret);
}

function matchPatternWithText(pattern, text) {
    if (pattern === '*') return true;
    const escapedPattern = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
    const regexPattern = '^' + escapedPattern.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern);
    return regex.test(text);
}

function matchCallPattern(callStatement, callPatterns) {
    for (const callPattern of callPatterns) {
        if (matchPatternWithText(callPattern, callStatement)) {
            return true;
        }
    }
    return false;
}

function comparePatternSpecificity(p1, p2) {
    // Count the number of non-wildcard characters (more literals = more specific)
    const literalLength = p => p.replace(/\*/g, '').length;

    // Count the number of wildcard '*' characters
    const wildcardCount = p => (p.match(/\*/g) || []).length;

    const ll1 = literalLength(p1);
    const ll2 = literalLength(p2);

    // First criterion: more literal characters = more specific
    if (ll1 !== ll2) return ll2 - ll1;

    const wc1 = wildcardCount(p1);
    const wc2 = wildcardCount(p2);

    // Second criterion: fewer wildcards = more specific
    if (wc1 !== wc2) return wc1 - wc2;

    // Third (tie-breaker): longer pattern is considered more specific
    return p2.length - p1.length;
}

function getMoreSpecificPattern(list) {
    let mostSpecific;
    for (const [pattern, f] of list) {
        if (!mostSpecific) {
            mostSpecific = [pattern, f];
        } else if (comparePatternSpecificity(pattern, mostSpecific[0]) < 0) {
            mostSpecific = [pattern, f];
        }
    }
    return mostSpecific[1];
}

function getServers() {
    if (!instance) {
        throw new ConfigError("Configuration not initialized. Use config.init(configFile) first.");
    }
    return instance.getYamlContent().servers;
}

function getRabbitConfig() {
    if (!instance) {
        throw new ConfigError("Configuration not initialized. Use config.init(configFile) first.");
    }
    return instance.getYamlContent().rabbitParameters;
}

function hasHttpFunctions(serverInfo) {
    return serverInfo.functions.some(
        f => f.method === 'http-get' ||
            f.method === 'http-post'
    );
}

function hasRabbitFunctions(serverInfo) {
    return serverInfo.functions.some(
        f => f.method === 'rabbit'
    );
}


export default {
    init, getConfigPath, getCodeGenerationParameters, getServerInfo, getServers, getRabbitConfig, getFunctionInfo, matchCallPattern, hasHttpFunctions, hasRabbitFunctions
}