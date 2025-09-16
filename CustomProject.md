# Using custom project with JS-Distributor

This guide describes how to create a monolith and distribute it using JS-Distributor, using a custom project as a template for the generated servers.

## Pre-requisites

All you need is [Node.js](https://nodejs.org/) and a code editor. JS-Distributor is available as a [npm](https://www.npmjs.com/) module.

## Step-by-step

1. Create an empty folder, called `custom-project`
2. Initialize a Node.js project and install JS-Distributor:

```sh
cd custom-project
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

4. Create a folder called `monolith`
5. Enter folder `monolith` and initialize a new `node.js` project, with a custom library set. We will install `validator` (for basic validations), and `express` and `amqplib` (which requires `uuid`), for the generated endpoints to work as HTTP servers and RabbitMQ producers/consumers:

```bash
cd monolith
npm init
npm install validator express amqplib uuid
```

6. Modify the generated `package.json` inside `monolith` file to use ES modules:

```diff
{
  "name": "monolith",
  "version": "1.0.0",
  "main": "index.js",
+  "type": "module",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "amqplib": "^0.10.9",
    "express": "^5.1.0",
    "uuid": "^13.0.0",
    "validator": "^13.15.15"
  }
}
```

7. Create a file named `app.js` at the `monolith` folder.

```javascript
import fs from 'fs/promises';
import validator from 'validator';

// Function to validate a person registration
function validatePerson(person) {
    const errors = [];

    // Name: must not be empty
    if (!person.name || validator.isEmpty(person.name.trim())) {
        errors.push('Name is required.');
    }

    // Email: must be valid
    if (!person.email || !validator.isEmail(person.email)) {
        errors.push('Invalid email.');
    }

    // Phone: only digits, Brazilian format
    if (!person.phone || !validator.isMobilePhone(person.phone, 'pt-BR')) {
        errors.push('Invalid phone number.');
    }

    // Birth date: must be a valid date in YYYY-MM-DD format
    if (!person.birthDate || !validator.isDate(person.birthDate)) {
        errors.push('Invalid birth date.');
    }

    // CPF: only digits, must be 11 characters (simple check)
    if (!person.cpf || !validator.isLength(person.cpf.replace(/\D/g, ''), { min: 11, max: 11 })) {
        errors.push('Invalid CPF.');
    }

    return errors;
}

// Function to register a person and check validation
async function registerPerson(person) {
    const validationErrors = validatePerson(person);

    if (validationErrors.length > 0) {
        console.log('Registration errors:');
        console.log(validationErrors);
        return false;
    } else {
        console.log('Registration is valid!');

        // Let's save to a file
        await fs.appendFile('database.json', JSON.stringify(person) + '\n', 'utf-8');
        console.log('Inserted into the database');

        return true;
    }
}

async function main() {
    const registration = {
        name: 'Maria Silva',
        email: 'maria.silva@example.com',
        phone: '+5511999998888',
        birthDate: '1990-05-12',
        cpf: '123.456.789-09'
    };

    await registerPerson(registration);

}

export default main;
```

8. Create a file called `entrypoint.js`. This will be the starting point of our application:

```javascript
import app from './app.js';

app();
```

9. Now you can run the monolith to see the results:

```sh
node ./monolith/entrypoint.js
```

10. Let's use JS-Distributor to split this monolith into two servers. Create a file called `config.yml`. Refer to the comments to understand each configuration part:

```yaml
codeGenerationParameters:
  mode: single                  # Runs the tool a single time (instead of watching for changes)
  inputFolder: 'monolith'       # Folder where to look for the monolith code
  outputFolder: 'distributed'   # Folder to generate the microservices
  cleanOutput: false            # Instructs the tool not to clean the output folder
  generateProjects: false       # Do not generate npm projects for the microservices
  ignore:                       # Folders to ignore in the monolith
    - "node_modules"
servers:                        # Now comes the three servers
  - id: alpha                   # alpha server will contain all functions
  - id: beta                    # beta server will contain function "validatePerson", exposed
    http:                       # at localhost, port 3000, as a HTTP POST endpoint
      url: localhost
      port: 3000
    functions:
      - declarationPattern: validatePerson
        method: http-post
  - id: gamma                   # gamma server will contain function "registerPerson", exposed
    http:                       # at localhost, port 3001, as a HTTP POST endpoint
      url: localhost
      port: 3001
    functions:
      - declarationPattern: registerPerson
        method: http-post
```

11. Execute the tool:

```sh
npm run js-dist
```

12. A folder called `distributed` will be generated. See how each server is a copy of the original monolith, but each function body has been replaced by a remote call whenever that function is not contained in that particular server.

13. See how the monolith's `package.json` was copied to each folder

14. Now open three terminals to install the necessary packages and run the distributed code

Start `beta` server:

```sh
cd distributed/beta
npm install
node start.js
```

Start `gamma` server:

```sh
cd distributed/gamma
npm install
node start.js
```

Now run `entrypoint.js` in the `alpha` server (which will call the other functions in the other servers)

```sh
cd distributed/alpha
npm install
node entrypoint.js
```

See how the code executes distributedly.

15. Now let's use RabbitMQ to allow our functions to communicate.
16. Create a file called `compose.yml`, to run RabbitMQ server inside Docker:

```yml
services:
  rabbit:                               # RabbitMQ container
    image: rabbitmq
    ports:
      - 5672:5672                       # For AMPQ connection
      - 8080:15672                      # Web interface

```

17. Run with `docker compose up -d`
18. Now modify the `config.yml` file to acknowledge and use RabbitMQ:

```diff
codeGenerationParameters:
  mode: single                  # Runs the tool a single time (instead of watching for changes)
  inputFolder: 'monolith'       # Folder where to look for the monolith code
  outputFolder: 'distributed'   # Folder to generate the microservices
  cleanOutput: false            # Instructs the tool not to clean the output folder
  generateProjects: false       # Do not generate npm projects for the microservices
  ignore:                       # Folders to ignore in the monolith
    - "node_modules"
+rabbitParameters:               # Details of the RabbitMQ communication
+  url: localhost
+  port: 5672
+  numConnectionAttempts: 5
+  timeBetweenAttempts: 10    
servers:                        # Now comes the three servers
  - id: alpha                   # alpha server will contain all functions
  - id: beta                    # beta server will contain function "validatePerson", exposed
    http:                       # at localhost, port 3000, as a HTTP POST endpoint
      url: localhost
      port: 3000
    functions:
      - declarationPattern: validatePerson
        method: http-post
  - id: gamma                   # gamma server will contain function "registerPerson", exposed
    http:                       # at localhost, port 3001, as a HTTP POST endpoint
      url: localhost
      port: 3001
    functions:
      - declarationPattern: registerPerson
+        method: rabbit
```

19. Repeat the process and see how everything works in the same way
20. Now, instead of running locally through `entrypoint.sh`, let's create an endpoint to save new persons. In the `monolith` folder, change the `registerPerson` function to return the validation errors:

```diff
import fs from 'fs/promises';
import validator from 'validator';

// Function to validate a person registration
function validatePerson(person) {
    const errors = [];

    // Name: must not be empty
    if (!person.name || validator.isEmpty(person.name.trim())) {
        errors.push('Name is required.');
    }

    // Email: must be valid
    if (!person.email || !validator.isEmail(person.email)) {
        errors.push('Invalid email.');
    }

    // Phone: only digits, Brazilian format
    if (!person.phone || !validator.isMobilePhone(person.phone, 'pt-BR')) {
        errors.push('Invalid phone number.');
    }

    // Birth date: must be a valid date in YYYY-MM-DD format
    if (!person.birthDate || !validator.isDate(person.birthDate)) {
        errors.push('Invalid birth date.');
    }

    // CPF: only digits, must be 11 characters (simple check)
    if (!person.cpf || !validator.isLength(person.cpf.replace(/\D/g, ''), { min: 11, max: 11 })) {
        errors.push('Invalid CPF.');
    }

    return errors;
}

// Function to register a person and check validation
async function registerPerson(person) {
    const validationErrors = validatePerson(person);

    if (validationErrors.length > 0) {
+        return {
+            success: false,
+            message: 'Registration failed due to validation errors.',
+            errors: validationErrors
+        };
    } else {
        console.log('Registration is valid!');

        // Let's save to a file
        await fs.appendFile('database.json', JSON.stringify(person) + '\n', 'utf-8');
        console.log('Inserted into the database');

+        return {
+            success: true,
+            message: 'Registration successful!'
+        };
    }
}

async function main() {
    const registration = {
        name: 'Maria Silva',
        email: 'maria.silva@example.com',
        phone: '+5511999998888',
        birthDate: '1990-05-12',
        cpf: '123.456.789-09'
    };

    await registerPerson(registration);

}

export default main;
```

21. Currently, this function is exported as RabbitMQ consumer. Let's change it to HTTP POST (due to the format of the arguments, HTTP GET is not possible), in the `config.yml` file. Just for fun, let's change the other function to use rabbit:

```diff
codeGenerationParameters:
  mode: single                  # Runs the tool a single time (instead of watching for changes)
  inputFolder: 'monolith'       # Folder where to look for the monolith code
  outputFolder: 'distributed'   # Folder to generate the microservices
  cleanOutput: false            # Instructs the tool not to clean the output folder
  generateProjects: false       # Do not generate npm projects for the microservices
  ignore:                       # Folders to ignore in the monolith
    - "node_modules"
rabbitParameters:               # Details of the RabbitMQ communication
  url: localhost
  port: 5672
  numConnectionAttempts: 5
  timeBetweenAttempts: 10    
servers:                        # Now comes the three servers
  - id: alpha                   # alpha server will contain all functions
  - id: beta                    # beta server will contain function "validatePerson", exposed
    http:                       # at localhost, port 3000, as a HTTP POST endpoint
      url: localhost
      port: 3000
    functions:
      - declarationPattern: validatePerson
+        method: rabbit
  - id: gamma                   # gamma server will contain function "registerPerson", exposed
    http:                       # at localhost, port 3001, as a HTTP POST endpoint
      url: localhost
      port: 3001
    functions:
      - declarationPattern: registerPerson
+        method: http-post
```
22. Now let's test the new endpoint. Re-run the tool, and start up the servers again. Then, using a REST API client, create a POST:

```
POST http://localhost:3001/registerPerson
Content-Type: application/json

{
    "person": {
        "name": "Fulano Santos",
        "email": "fulano.silvaemail.com",
        "phone": "5516xxxxx",
        "birthDate": "1990-05-12",
        "cpf": "123.456.789-09"
    }
}
```

See how the errors are reported in the result. Fix the errors and try again, and see how the person is inserted into our "database"

23. Now head to the [Acme Air example](AcmeAir.md) to an example that fully exercises JS-Distributor.