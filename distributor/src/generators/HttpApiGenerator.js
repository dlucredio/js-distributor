import { StringBuilder } from "./GeneratorUtils.js";

function generateHttpRequestCode(functionName, serverInfo, functionInfo, args = []) {
    const stringBuilder = new StringBuilder();

    let fetchUrl = `http://${serverInfo.url}:${serverInfo.port}/${functionName}`;

    if (functionInfo.method === "http-get") {
        if (args.length > 0) {
            fetchUrl += "?";
            for (let i = 0; i < args.length; i++) {
                fetchUrl += args[i] + "=${" + args[i] + "}";
                if (i < args.length - 1) {
                    fetchUrl += "&";
                }
            }
        }
        stringBuilder.append("const response = await fetch(\`"+fetchUrl+"\`);");
        stringBuilder.append("const { result } = await response.json();");
        stringBuilder.append("return result;");
        return stringBuilder.toString();
    }
    return "// not implemented";

}

export default {
    generateHttpRequestCode
}