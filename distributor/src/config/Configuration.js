import path from "path";
import fs from "fs";
import yaml from "js-yaml";

let instance = null;

class ConfigSingleton {
    constructor(configFile) {
        this.yamlPath = path.resolve(configFile);
    }

    getYamlContent() {
        return yaml.load(fs.readFileSync(this.yamlPath, 'utf8'));
    }
}

function init(configFile) {
    if (instance) {
        throw new Error("Configuration already initialized.");
    }
    instance = new ConfigSingleton(configFile);
};

function getServerInfo(functionName) {
    if (!instance) {
        throw new Error("Configuration not initialized. Use config.init(configFile) first.");
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
        throw Error(`Error in ${instance.yamlPath}. Function ${functionName} is not assigned to a server.`)
    }
    return getMoreSpecificPattern(ret);
}

function getFunctionInfo(serverInfo, functionName) {
    if (!instance) {
        throw new Error("Configuration not initialized. Use config.init(configFile) first.");
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
        throw Error(`Error in ${instance.yamlPath}. Function ${functionName} is not assigned to server ${serverInfo.id}.`)
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
        throw new Error("Configuration not initialized. Use config.init(configFile) first.");
    }
    return instance.getYamlContent().servers;
}

export default {
    init, getServerInfo, getServers, getFunctionInfo
}

// get servers() {
//     if (!instance) {
//         throw new Error("Configuration not initialized. Use config.init(configFile) first.");
//     }
//     return instance.getYamlContent().servers;
// },
// get functions() {
//     if (!instance) {
//         throw new Error("Configuration not initialized. Use config.init(configFile) first.");
//     }
//     return instance.getYamlContent().functions;
// }
