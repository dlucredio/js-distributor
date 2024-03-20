# js-distributor


**Cloning the repository and installing dependencies:**

To run the generator and perform code distribution, simply clone the repository via git and properly install the dependencies using the **'npm install'** command, which will generate the node_modules folder with all the necessary dependencies. Additionally, since the project may generate code with messaging service technologies, specifically RabbitMQ, it's important to install the Advanced Message Queuing Protocol (AMQP) at the root of the project using the **'npm install amqp'** command. Another necessary tool to run the distributor is Antlr4, which must be properly installed for JavaScript following the guide available at: https://www.antlr.org/download.html.

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

**Configuration of yaml file**

In order to run the distributor in your project, you must configurate a configuration file called 'config.yml', which should be created in the root of the project. There, you should write the specifications of the functions and servers you want go generate:

* Functions: It's necessary to inform the name, server related, method (rabbit, get or post) and parameters. Each parameter should have its name and type; Also, it's important to know the limitations of HTTP method GET for passing arguments in a function, which only supports numbers and strings. Thus, if a function uses an array or any other more complex object in its parameters, the method chosen in yaml must be POST or rabbit.
* Servers: It's necessary to inform the id (name of server), port in which the server will be listening, url and rabbitmq information in case it is a rabbit server as well. In this case the following fields must be present: exchange, queue and connectionUrl

It's important that all functions have an associated and specified server in the file and that servers and functions do not have repeated names. 

A fictional example of a yaml file is shown below. The example contains two servers, alfa and gama. Alfa is a rabbit server and gama is an express server only. The functions are validateEmail and main.

![image](https://github.com/dlucredio/js-distributor/assets/99351180/3ab6286f-460c-4838-a94e-3d6bd964e296)



**Running the Distributor on a Project**

Once the config.yml file is configured, you can run the distributor by executing the command 'npm run generate-single' on the root of the project.
