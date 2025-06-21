// =============== HTTP get fetch with query parameters ================
function httpGetFetch(functionName, serverUrl, serverPort, args) {
    let fetchUrl = `http://${serverUrl}:${serverPort}/${functionName}`;
    if (args.length > 0) {
        fetchUrl += "?" + args.map(a => a + "=${" + a + "}").join("&");
    }

    return `

    const response = await fetch(\`${fetchUrl}\`);
    const { executionResult } = await response.json();
    return executionResult;

`
};

// =============== HTTP post fetch with body parameters ================
function httpPostFetch(functionName, serverUrl, serverPort, args) {
    const fetchUrl = `http://${serverUrl}:${serverPort}/${functionName}`;
    const body = "{" + args.map(a => '"' + a + '" : ' + a).join(",") + "}";
    return `

    const response = await fetch(\`${fetchUrl}\`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(${body})
    });
    const { executionResult } = await response.json();
    return executionResult;

`
};


function httpMockedFuntions(functionName, mockResponse, args) {
    console.log("Mocking function: " + functionName);
    return `
    {
        return ${mockResponse};
    }`;
}
export default {
    httpGetFetch, httpPostFetch, httpMockedFuntions
}