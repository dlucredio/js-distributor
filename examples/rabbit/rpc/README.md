# JS-Distributor with Rabbit example

## RPC communication

This example demonstrates three ways to generate RPC-like communication with RabbitMQ, as [described in this official RabbitMQ tutorial](https://www.rabbitmq.com/tutorials/tutorial-six-javascript).

Each example uses a different configuration file:

* `config_default.yml`: JS-Distributor automatically generates the queue name and uses an anonymous callback queue for the function to be called using RabbitMQ
* `config_with_rpc_queue.yml`: Specifies a queue for the function to be called using RabbitMQ
* `config_with_rpc_queue_and_callback_queue.yml`: Specifies a queue AND a callback queue for the function to be called using RabbitMQ

Use the tasks provided in `package.json` to run each way.

After generating the code, inspect the generated files to see the differences.
