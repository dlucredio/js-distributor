﻿# js-distributor


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
