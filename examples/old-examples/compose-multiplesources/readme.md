# Example: Using Multiple Compose Files

This example demonstrates how to use multiple Docker Compose files to efficiently reuse pre-existing services, such as a database configuration. By leveraging multiple compose files, you can modularize your setup, making it easier to manage and extend.

## Key Concepts

- **Service Reusability**: Reuse existing service definitions (e.g., a database) without duplicating configuration.
- **Modular Configuration**: Separate concerns by splitting configurations into multiple compose files.
- **Flexibility**: Combine and override configurations as needed for different environments or use cases.

## How It Works

1. Using compose Include
   1.1 On the generated docker compose you would have to include de the path of the others composes you want to utilize.
   1.2 Every service, networks, volumes can be used on the generated compose, so all you need to do is define that the service will use the already defined configurations(_with the same names_).
   1.3 Example:
   ```bash
   docker compose -f compose_include_services.yaml up
   ```
2. Using compose merge

   1.1 On the generated Docker Compose, you have to define that the service will be using some configurations that are already created by other compose files. The names must match.

   1.2 Example: Use the following command to merge multiple compose files and bring up the services:

   ```bash
   docker compose -f compose1.yml -f compose2.yml ... -f compose_merge_services.yaml up
   ```

## Benefits

- Simplifies service management.
- Reduces duplication in configuration files.
- Encourages a clean and modular approach to defining services.

Explore this example to see how you can apply these principles in your projects.
