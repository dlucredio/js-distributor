# JS-Distributor

JS-Distributor is a research-driven tool that facilitates the transformation of monolithic JavaScript applications into microservices. It bridges the gap between architectural decomposition and actual deployment by automatically generating boilerplate code for distributed systems using Node.js.

## Demo

Video at: https://doi.org/10.5281/zenodo.15477214

## Overview

Monolithic applications can be hard to scale and maintain. While many tools focus on identifying microservices, few support developers in **actually implementing and deploying** them. JS-Distributor changes that by automating:

- Server code generation
- Inter-service communication (HTTP or RabbitMQ)
- Remote call replacement
- Async/await propagation

All based on a simple YAML configuration file.

## Key Features

- Automatic code generation for:
  - HTTP-based APIs (`GET` and `POST`)
  - Asynchronous messaging via **RabbitMQ**
- Transparent marshalling of parameters and results
- Support for distributed execution across multiple servers
- Minimal developer intervention: just configure and run
- Integration-ready with real-world projects (e.g., [Acme Air](https://github.com/dlucredio/acmeair-nodejs))

## How It Works

1. Start from a monolithic JavaScript project
2. Create a `config.yml` file specifying how functions should be distributed
3. Run JS-Distributor to generate:
   - Individual server code
   - Client stubs for remote communication
   - Updated source code with remote calls replacing local ones

JS-Distributor will then generate the servers and rewire the application logic for distributed execution.

## Installation & Usage

Check our [Getting Started](GettingStarted.md) page for detailed instructions to start using JS-Distributor.

For a more complete example check out the [Acme Air example](AcmeAir.md).

Also check the [examples](examples) folder.

## Authors

- Guilherme Salvador Escher
- Maurício Gallera de Almeida
- João Vitor Fidelis Cardozo
- Romeu Leite
- Ivan Capeli Navas
- Vinicius Nordi Esperança
- Daniel Lucrédio

Federal University of São Carlos – UFSCar

## Contributing

Contributions are welcome! If you have suggestions, improvements, or bug reports, feel free to open an issue or submit a pull request.

## Acknowledgements

This work was supported by São Paulo Research Foundation (FAPESP), grant # 2021/06983-2. The opinions, hypotheses, conclusions, or recommendations expressed in this material are the responsibility of the author(s) and do not necessarily reflect the views of FAPESP.