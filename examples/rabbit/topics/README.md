# JS-Distributor with Rabbit example

## Topics

This example demonstrates how RabbitMQ's exchange can be used to deliver messages to a topic, as [described in this official RabbitMQ tutorial](https://www.rabbitmq.com/tutorials/tutorial-five-javascript).

The monolith has two functions: `mergeSort` and `quickSort`. Both are called by `main` in sequence. A function called `logSortCall` is not used in the monolith.

The distributed architecture described in `config.yml` does the following:

* `mergeSort` will run on alpha, under RabbitMQ;
* `quickSort` will run on beta, under RabbitMQ;
* `logSortCall` will run on delta, under RabbitMQ;
* `mergeSort`, `quickSort` and `logSortCall` each has its own queue;
* `mergeSort`, `quickSort` and `logSortCall`'s queues are bound to a single topic exchange called `sortExchange`
* Messages sent to the topic `sort.merge` will be delivered to `mergeSort` and `logSortCall`
* Messages sent to the topic `sort.quick` will be delivered to `quickSort` and `logSortCall`

To execute, start `compose.yml`, then start beta, gamma and delta, and execute `entrypoint.js` in alpha.