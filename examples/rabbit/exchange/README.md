# JS-Distributor with Rabbit example

## Direct exchange

This example demonstrates how RabbitMQ's exchange can be used to deliver messages to a queue (or multiple queues), as [described in this official RabbitMQ tutorial](https://www.rabbitmq.com/tutorials/tutorial-four-javascript).

Each example uses a different configuration file:

* `config_direct.yml`: Two functions, two queues, and a single exchange that delivers direct messages according to the routing key: "merge" for beta server and "quick" for gamma server
* `config_multiple_bindings.yml`: Same as above, but a single routing key is used. As a result, the exchange will deliver messages to both beta and gamma simultaneously. See how each sorting request is executed twice, changing the original monolith behavior.
* `config_fanout.yml`: Uses a fanout exchange, which delivers messages to every bound queue, regardless of routing key. The behavior is the same as the example above (each request is executed twice).

Use the tasks provided in `package.json` to run each way.

After generating the code, inspect the generated files to see the differences.

To execute, start `compose.yml`, the start beta and gamma and execute `entrypoint.js` in alpha.