# js-distributor

The purpose of this section is to explain how install and contribute to the js-distrubutor project. For information on how to use the distributor in your project, see the "Getting Started with js-distributor" section.

**What is js-distributor?**

This project is capable of automatically generating code to distribute a monolithic JavaScript project across multiple servers using their functions. It requires the configuration of a .yaml file that is responsible for the structuring the servers and their associated functions. 

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
