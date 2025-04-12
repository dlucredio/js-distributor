import path from "path";
import fs from "fs";
import yaml from "js-yaml";

let instance = null;

class ConfigSingleton {
    constructor(configFile) {
        this.yamlPath = path.resolve(configFile);
    }

    getYamlContent() {
        const yamlContent = yaml.load(fs.readFileSync(this.yamlPath, 'utf8'));

        // Let's add the defaults and do some validation/preparation
        // - Lowercase function methods
        // - Check for valid methods
        const validMethods = ['http-get', 'http-post', 'rabbit'];
        for (const serverInfo of yamlContent.servers) {
            // Every server must have a genFolder
            // If none is specified, we use 'src-gen'
            if (!serverInfo.genFolder) {
                serverInfo.genFolder = 'src-gen';
            }
            if(!isIterable(serverInfo.functions)) {
                serverInfo.functions = [];
            }
            // Every function must have a method
            // If none is specified, we use 'http-get'
            for (const functionInfo of serverInfo.functions) {
                if (!functionInfo.method) {
                    functionInfo.method = 'http-get';
                } else {
                    functionInfo.method = functionInfo.method.toLowerCase();
                    if (!validMethods.includes(functionInfo.method)) {
                        throw new ConfigError(`Error: function ${functionInfo.pattern} in server ${serverInfo.id} has invalid method: ${functionInfo.method}`);
                    }
                }
            }
        }

        return yamlContent;
    }
}

function isIterable(obj) {
    return obj != null && typeof obj[Symbol.iterator] === 'function';
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

// TODO: modify this to rely not only on functionName, but also
// other information, such as path, so that we can have more
// than one function with the same name
function getServerInfo(functionName) {
    if (!instance) {
        throw new ConfigError("Configuration not initialized. Use config.init(configFile) first.");
    }
    const servers = instance.getYamlContent().servers;
    const ret = [];
    for (const s of servers) {
        const functions = s.functions;
        if (functions) {
            for (const f of functions) {
                if (matchFunctionName(f.pattern, functionName)) {
                    ret.push([f.pattern, s]);
                }
            }
        }
    }
    if (ret.length == 0) {
        throw new ConfigError(`Error in ${instance.yamlPath}. Function ${functionName} is not assigned to a server.`)
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
            if (matchFunctionName(f.pattern, functionName)) {
                ret.push([f.pattern, f]);
            }
        }
    }
    if (ret.length == 0) {
        throw ConfigError(`Error in ${instance.yamlPath}. Function ${functionName} is not assigned to server ${serverInfo.id}.`)
    }
    return getMoreSpecificPattern(ret);
}

function matchFunctionName(pattern, functionName) {
    if (pattern === '*') return true;
    const escapedPattern = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
    const regexPattern = '^' + escapedPattern.replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern);
    return regex.test(functionName);
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

export default {
    init, getServerInfo, getServers, getFunctionInfo
}