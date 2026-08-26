```yaml

functions:
    - declarationPattern: useCase
      method: http-get
      object-args:
        - objectName:
            - getter.arg1
        - functionArg:
            - getter.arg1
```

Then, when generating server
replace identifier by <objectArgs> name, and each respective arg pass as <objectArgs>-<num>: arg

## Issues:

1. ### How to collect args for each functions ?It can come from a long chain...  BIG ISSUE
2. How to generate the server correctly ?
3. When passing the arg, how to detect it and replace correctly ?
4. How to import the function on the "remote" server ?
5. How to assemble the object correctly on the "remote" server ?

Solutions:
1. The arg1 on the yaml could be a "getter", therefor we can use it to retrieve the argument for the current posicional parameter.(fix long chain of calls) but the developer would need to implement a getter for all parameters...not a real issue...but...


## Workflow

### First Idea

On the client side:
    
```mermaid
flowchart TD
    A[Client side] --> B{Is the function remote?}
    B -->|Yes| C[Build request to server]
    B -->|No| D[Call function locally]
    C --> E{current function has object args  ?}
    E --> |Yes| F[Read data from yaml about the current function]
    E --> |No| G[Default Flow, just pass the args]
    F --> H[Replace the args, got from the map 'functionName, getter' , on server call by functionName, currentInstance.getArg... ]
```
---
On the server side:

```mermaid
flowchart TD
    A[Server side] --> B{Is the function present on the yaml data?}
    B -->|Yes| C[Read data from yaml 'functionName, getters']
    B -->|No| D[Default flow, just read the args]
    C --> E[Import function name. Issue 4.]
    E --> F[Read arg and instantiate the object with the values, for now it will be passed on the 'constructor'. Issue 5]
    F --> H[With the object correctly created, pass along on the flow]
```