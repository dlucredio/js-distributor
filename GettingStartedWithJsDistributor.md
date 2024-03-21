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
* Create a directory and git clone the js-distributor into it.
* Run 'npm install' in the js-distributor/distributor root directory to install its dependencies.
* Create a directory for a new project and run 'npm init' in your root.
* Install js-distributor inside your project using 'npm install path-to-js-distributor/js-distributor/distributor'.
* Some other dependecies are needed for the distributor. Thus, run 'npm install express node-fetch amqplib'.
* Add the following script to the "scripts" in package.json file: "generate-single": "distributor-scripts single copypaste src src-gen".

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

In this example functions are defined with get and post methods and only HTTP calls are made in the server communication. If you want to use message brokers, you can configure the yaml as shown below:

**Running the js-distributor**

Open a terminal and run "npm run generate-single". A directory src-gen must be created with the files 'functions-alfa.js', 'functions-gama.js', 'start-alfa.js'
and 'start-gama.js'.

**Running servers**

In order to run the servers and test it, you can run 'node start-alfa.js' and 'node start-gama.js' inside the src-gen directory and using two different terminals. 

**

