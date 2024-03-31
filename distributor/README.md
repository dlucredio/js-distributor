# js-distributor

**What is js-distributor?**

This project is capable of automatically generating code to distribute a monolithic JavaScript project across multiple servers using their functions. It requires the configuration of a .yaml file that is responsible for the structuring the servers and their associated functions. 

**Installing js-distributor and its dependencies:**

To run the generator and perform code distribution, simply run 'npm install js-distributor' in your terminal. Additionally, some other dependecies are needed for the distributor. Thus, run 'npm install express node-fetch amqplib'. These dependecies are required to ensure communication via HTTP methods or Messages using the Advanced Message Queuing Protocol (AMQP).

**Installing RabbitMQ on Windows**

To install RabbitMQ on Windows, you should follow the instructions available at https://www.rabbitmq.com/docs/download. Basically, you'll need to install Erlang OTP, which can be done through the link: https://www.rabbitmq.com/docs/which-erlang. Care should be taken with compatibility, as RabbitMQ only supports versions 25.x and 26.x of Erlang.

Additionally, you'll need to install the Windows installer, which will install the necessary resources to run RabbitMQ on your machine.

After completing the procedure, you'll have the following available on your machine:

* RabbitMQ Service - start: to start the Rabbit service on your machine.
* RabbitMQ Service - stop: to stop the Rabbit service.
* RabbitMQ command prompt: to be used for configuring the services.

Go to start menu and search for rabbitmq command prompt.
type command "rabbitmq-plugins enable rabbitmq_management", This command is used to enable the RabbitMQ management plugin.
Done! RabbitMQ is properly installed. Now, in your browser, navigate to http://localhost:15672 to access the RabbitMQ web management interface. This interface allows you to view statistics, manage queues, exchanges, users, virtual hosts, and many other RabbitMQ-related configurations and operations.

**Installing RabbitMQ on Linux**

To install RabbitMQ on Ubuntu, you should follow the instructions available at https://www.rabbitmq.com/docs/install-debian#installation-methods. There you will find a script that installs all necessary dependecies. Then, you can follow the steps below: 

1. Open a terminal and run 'cd ~/Downloads';
2. 'touch rabbitmq.sh' in order to create the file that is going to contain the script for installation of RabbitMQ;
3. 'code rabbitmq.sh' and paste the script copied from the manual;
4. 'chmod +X rabbitmq.sh' ir order to change permissions and make the file executable;
5. './rabbitmq.sh' to run the script and finally install RabbitMQ.

Once the installation is finished, you can check the status of the rabbit server with 'sudo systemctl status rabbitmq-server'. In case the service is not running, you can run 'sudo systemctl enable rabbitmq-server'.

All steps above are also available on the following video https://www.youtube.com/watch?v=N-AqOeaP8Ag

**How to use**

Considering a project with source code in ./src that will be distribuited into ./src-gen, the js-distributor can be applied by running 'npx js-distributor-scripts single copypaste src src-gen'. To simplify this, you can create a script in the package.json file: "generate-single": "js-distributor-scripts single copypaste src src-gen" and run 'npm run generate-single'. For more detailed information on how to use js-distributor, see the example below.

# Getting started with js-distributor: A quick example

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

In this example functions are defined with get and post methods and only HTTP calls are made in the server communication. If you want to use message brokers, you can configure the yaml as shown below:

**Running the js-distributor**

Open a terminal and run "npm run generate-single" if you defined the script in the package.json or 'npx npx js-distributor-scripts single copypaste src src-gen' if you didn't. A directory src-gen must be created with the files 'functions-alfa.js', 'functions-gama.js', 'start-alfa.js' and 'start-gama.js'.

**Running servers**

In order to run the servers and test it, you can run 'node start-alfa.js' and 'node start-gama.js' inside the src-gen directory and using two different terminals. 