# Getting started with JS-Distributor

This guide describes how to create a monolith and distribute it using JS-Distributor.

## Pre-requisites

All you need is [Node.js](https://nodejs.org/) and a code editor. JS-Distributor is available as a [npm](https://www.npmjs.com/) module.

## Step-by-step

1. Create an empty folder, called `hello-world`
2. Initialize a Node.js project and install JS-Distributor:

```sh
cd hello-world
npm init
npm install js-distributor
```

3. Modify the generated `package.json` file to use ES modules and create the script to run the tool:

```diff
{
  "name": "hello-world",
  "version": "1.0.0",
  "main": "index.js",
+  "type": "module",
  "scripts": {
+    "js-dist": "js-distributor-scripts"
  },
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "js-distributor": "^2.0.2"
  }
}
```

4. Create a file named `app.js` at the root folder. This will be our monolith. We will create three functions to be distributed:

```javascript
function getMessage(greeting, person) {
    console.log("Getting message");
    return greeting + ", " + person + "!";
}

function getFullName(firstName, lastName) {
    console.log("Getting full name");
    return firstName + " " + lastName;
}

function main() {
    console.log("Running application");
    const fullName = getFullName("John", "Doe");
    const greeting = "Hello";
    const message = getMessage(greeting, fullName);
    console.log(message);
}

export default main;
```

5. Create a file called `entrypoint.js`. This will be the starting point of our application:

```javascript
import app from './app.js';

app();
```

6. Now you can run the monolith to see the results:

```sh
node ./entrypoint.js
```

7. Let's use JS-Distributor to split this monolith into three servers. Create a file called `config.yml`. Refer to the comments to understand each configuration part:

```yaml
codeGenerationParameters:
  mode: single                  # Runs the tool a single time (instead of watching for changes)
  inputFolder: '.'              # Folder where to look for the monolith code
  outputFolder: 'distributed'   # Folder to generate the microservices
  cleanOutput: true             # Instructs the tool to clean the output folder
  generateProjects: true        # Generates npm projects for the microservices
  ignore:                       # Folders to ignore in the monolith
    - "node_modules"
servers:                        # Now comes the three servers
  - id: alpha                   # alpha server will contain all functions
  - id: beta                    # beta server will contain function "getMessage", exposed
    http:                       # at localhost, port 3000, as a HTTP GET endpoint
      url: localhost
      port: 3000
    functions:
      - declarationPattern: getMessage
        method: http-get
  - id: gamma                   # gamma server will contain function "getFullName", exposed
    http:                       # at localhost, port 3001, as a HTTP POST endpoint
      url: localhost
      port: 3001
    functions:
      - declarationPattern: getFullName
        method: http-post
```

8. Execute the tool:

```sh
npm run js-dist
```

9. A folder called `distributed` will be generated. See how each server is a copy of the original monolith, but each function body has been replaced by a remote call whenever that function is not contained in that particular server.

10. Now open three terminals to run the distributed code

Start `beta` server:

```sh
cd distributed/beta
node start.js
```

Start `gamma` server:

```sh
cd distributed/gamma
node start.js
```

Now run `entrypoint.js` in the `alpha` server (which will call the other functions in the other servers)

```sh
cd distributed/alpha
node entrypoint.js
```

See how the code executes distributedly.

11. Now try to modify the `config.yml` to use `POST` instead of `GET`, and repeat the process. See how the code changes to reflect the new method.

```diff
codeGenerationParameters:
  mode: single
  inputFolder: '.'
  outputFolder: 'distributed'
  cleanOutput: true
  generateProjects: true
  ignore:
    - "node_modules"
servers:
  - id: alpha
  - id: beta
    http:
      url: localhost
      port: 3000
    functions:
      - declarationPattern: getMessage
+        method: http-post
  - id: gamma
    http:
      url: localhost
      port: 3001
    functions:
      - declarationPattern: getFullName
        method: http-post

```

12. Now experiment a slighly more complex example, where custom libraries are used, in the [Custom Project](CustomProject.md) page.