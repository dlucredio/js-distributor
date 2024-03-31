# Getting started with js-distributor

The purpose of this section is to illustrate the use of the distributor using two example functions that will be distribuited into two servers: Alfa and Gama. 

The functions used are 'isAEqualToB' and 'sub' and their definitions are shown below: 

``` JavaScript
function isAEqualToB(a, b) {
    const subResult = sub(a, b);

    if (subResult === 0) return true;
    else return false;
}

function sub(a, b) {
    return a - b;
}
```


**Installing nodejs and the js-distributor**

* First, it's necessary to have nodejs installed on your device. If you don't have it yet, you can install it here: https://nodejs.org/en.
* Create a directory with a npm project created inside it and install js-distributor via 'npm i js-distributor'.
* Some other dependecies are needed for the distributor. Thus, run 'npm install express node-fetch amqplib'.
* Add the following script to the "scripts" in package.json file: "generate-single": "js-distributor-scripts single copypaste src src-gen" so you can run the js-distributor via 'npm run generate-single' instead of 'npx npx js-distributor-scripts single copypaste src src-gen' (optional)

**Creating the files with the functions that will be distributed**

In the root of the project, create a directory named 'src' and a file named 'example.js' (example name. Any name can be used) inside it. There, write the functions 'isAEqualToB' and 'sub' defined above.

**Creating a .yaml configuration file**

In the root directory of the new project, create a file called 'config.yml'. Inside this file, useful informations about the functions to be distributed and their related servers are defined. Thus, define the functions and servers as below:

```yaml
servers:
  - id: alfa
    port: 3000
    url: localhost
  - id: gama
    port: 3001
    url: localhost

functions:
  - name: isAEqualToB
    parameters:
      - name: a
        type: number
      - name: b
        type: number
    method: get
    server: alfa
  - name: sub
    parameters:
      - name: a
        type: number
      - name: b
        type: number
    method: post
    server: gama
```

In this example functions are defined with get and post methods and only HTTP calls are made in the server communication. To enable communication between servers using RabbitMQ, you can modify the method specified in the .yaml file to 'rabbit', in addition to adding a ConnectionURL (connection route to RabbitMQ services defined in your computer settings) in the servers' definitions. This will cause the distributor to generate code that uses RabbitMQ for asynchronous communication between servers.

For the function isAEqualToB, defined on the Gama server, the configuration would appear as follows:

```yaml
servers:
  - id: alfa
    port: 5555
    url: localhost
    rabbitmq:
      exchange: alfa_exchange
      queue: alfa_queue
      connectionUrl: amqp://localhost
  - id: gama
    port: 4444
    url: localhost
    rabbitmq:
      exchange: gama_exchange
      queue: gama_queue
      connectionUrl: amqp://localhost

functions:
  - name: isAEqualToB
    server: gama
    parameters:
      - name: a
        type: number
      - name: b
        type: number
    method: rabbit
  - name: sub
    server: alfa
    parameters:
      - name: a
        type: number
      - name: b
        type: number
    method: rabbit

```
In the generated code, server functions will be divided between producers and consumers of RabbitMQ messages. The functions-server file will contain producer functions, responsible for sending messages to RabbitMQ queues and processing them later. The start-server will be responsible for setting up the queues, waiting for calls, and forwarding received messages to the appropriate consumer functions for processing.

In summary, by using the 'rabbit' method in the .yaml file, the distributor will generate code that uses RabbitMQ for communication between servers, providing a robust and scalable architecture for your distributed system.

**Running the js-distributor**

Open a terminal and run "npm run generate-single" if you defined the script in the package.json or 'npx npx js-distributor-scripts single copypaste src src-gen' if you didn't. A directory src-gen must be created with the files 'functions-alfa.js', 'functions-gama.js', 'start-alfa.js' and 'start-gama.js'.

**Running servers**

In order to run the servers and test it, you can run 'node start-alfa.js' and 'node start-gama.js' inside the src-gen directory and using two different terminals. 

