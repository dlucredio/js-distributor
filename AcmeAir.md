# JS-Distributor + Acme Air

Acme Air is an implementation of a fictitious airline website that can be used to search and book flights. The original project has not been updated for a while, therefore we will use an updated version that runs in Node.js, created as a [fork of the original repository](https://github.com/dlucredio/acmeair-nodejs).

## Pre-requisites

You must have [Git](https://git-scm.com/), [Node.js](https://nodejs.org/pt) and [Docker](https://www.docker.com/) installed. A code editor is also necessary.

## Step-by-step

1. Create a new folder called `acmeair-nodejs-with-js-distributor`
2. Initialize a Node.js project and install JS-Distributor:

```sh
cd acmeair-nodejs-with-js-distributor
npm init
npm install js-distributor
```

3. Modify the generated `package.json` file to create the two scripts to run the tool (we will create two different distributions for it):

```diff
{
  "name": "acmeair-nodejs-with-js-distributor",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
+    "js-dist-1": "js-distributor-scripts -c example1/config.yaml",
+    "js-dist-2": "js-distributor-scripts -c example2/config.yaml",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "js-distributor": "^2.0.2"
  }
}
```

4. Let's clone the "Acme Air" project. Be sure to run the command inside the project folder:

```sh
git clone https://github.com/dlucredio/acmeair-nodejs.git
```

5. Create a folder called `example1`
6. Copy file `package.json` from the `acme-air` folder into `example1`. Rename it to `amqplib_package.json`

```sh
cp .\acmeair-nodejs\package.json .\example1\amqplib_package.json
```

7. Now modify the newly copied file to include the `amqplib` node module. This will be used for communication via [RabbitMQ](https://www.rabbitmq.com/) messages:

```diff
{
    "name": "acmeair",
    "version": "0.0.4",
    "type": "module",
    "private": true,
    "scripts": {
      "start": "node app.js"
    },
    "dependencies": {
+      "amqplib": "^0.10.8",
      "async": "^3.2.6",
      "body-parser": "^2.2.0",
      "cassandra-driver": "^4.8.0",
      "circuit-breaker": "^0.0.4",
      "cookie-parser": "^1.4.7",
      "csv-parse": "^5.6.0",
      "express": "^5.1.0",
      "log4js": "^6.9.1",
      "method-override": "^3.0.0",
      "mongodb": "^6.16.0",
      "morgan": "^1.10.0",
      "nano": "^10.1.4",
      "path": "^0.12.7",
      "stats-lite": "^2.2.0",
      "ttl-lru-cache": "^0.0.2",
      "uuid": "^11.1.0"
    }
  }
  ```

8. Copy file `Dockerfile` from the `acme-air` folder into `example1`. Rename it to `server_Dockerfile`

```sh
cp .\acmeair-nodejs\Dockerfile .\example1\server_Dockerfile
```

9. Now modify the newly copied file to change the port and entrypoint for the container:

```diff
FROM node:slim

WORKDIR /home/node/app

# Let's first install the packages (to better cache layers)
COPY package*.json ./
RUN npm install

# Now we can copy the rest (ignoring content from .dockerignore)
COPY . .

+ # 3000 is the app
+ EXPOSE 3000


# Use the following environment variable to define datasource location
ENV MONGO_URL mongodb://mongo:27017/acmeair
#ENV CLOUDANT_URL

+ ENTRYPOINT [ "node", "start.js"]
```

10. Create a file called `compose.yaml` inside folder `example1`, with the following content. Refer to the comments for details. This will be used to start the servers using Docker:

```yaml
services:
  mongo:                                # MongoDB container
    image: mongo:latest
    ports:
      - "27017:27017"
    # volumes:                          # Uncomment these lines to store data persistently
    #   - ./database_volume:/data/db    # Leave commented to start a new database every run
    restart: unless-stopped
  rabbit:                               # RabbitMQ container
    image: rabbitmq
    ports:
      - 5672:5672                       # For AMPQ connection
      - 8080:15672                      # Web interface
  alpha:                                # Alpha container
    build: ./distributed/alpha
    ports:
      - "9080:9080"
  beta:                                 # Beta container
    build: ./distributed/beta
    ports:
      - "3000:3000"
  gamma:                                # Gamma container
    build: ./distributed/gamma
    ports:
      - "3001:3000"
  delta:                                # Delta container
    build: ./distributed/delta
    ports:
      - "3002:3000"
```

11. Now create the `config.yaml` file, used by JS-Distributor to split Acme Air into four different servers. Refer to the comments for details:

```yaml
codeGenerationParameters:
  mode: single                          # single | watch
  inputFolder: '../acmeair-nodejs'      # monolith folder (relative to config.yml)
  outputFolder: 'distributed'           # distributed folder (relative to config.yml)
  cleanOutput: true                     # delete output folder before?
  generateProjects: false               # generate new npm projects?
  generateDocker: false                 # generate docker files for each server?
  ignore:                               # ignore the following folders
    - "node_modules"
    - "database_volume"
    - ".git"
rabbitParameters:                       # Details of the RabbitMQ communication
  url: rabbit
  port: 5672
  numConnectionAttempts: 5
  timeBetweenAttempts: 10
servers:
  - id: alpha
    copyFiles:                          # This command copies files from the example folder
      - from: amqplib_package.json      # this is relative to current path
        to: package.json                # this is relative to server path
  - id: beta
    copyFiles:
      - from: server_Dockerfile         
        to: Dockerfile                  
      - from: amqplib_package.json      
        to: package.json                
    http:
      url: beta
      port: 3000
    functions:                          # These functions will run on beta server, using HTTP POST
      - declarationPattern: getFlightByAirportsAndDepartureDate
        method: http-post
      - declarationPattern: getFlightSegmentByOriginPortAndDestPort
        method: http-post
  - id: gamma
    copyFiles:
      - from: server_Dockerfile       
        to: Dockerfile                
      - from: amqplib_package.json    
        to: package.json              
    http:
      url: gamma
      port: 3000
    functions:                          # These functions will run on gamma server, using RabbitMQ
      - declarationPattern: '*Session'  # Notice the use of wildcard
        method: rabbit
  - id: delta
    copyFiles:
      - from: server_Dockerfile     
        to: Dockerfile              
      - from: amqplib_package.json    
        to: package.json              
    http:
      url: delta
      port: 3000
    functions:                          # This functions will run on delta server, using HTTP GET (the default)
      - declarationPattern: startLoadDatabase
```

12. Now run the tool:

```sh
npm run js-dist-1
```

13. The generated code will be located in `example1/distributed` folder. See how each server contains all necessary client/server code according to the communication technology chosen.

14. Now run the distributed system. The following command starts the database, RabbitMQ and the four servers. It will run in background and connect the logs from the four servers so we can see their outputs:

```sh
cd example1
docker compose up --build -d && docker compose logs -f alpha beta gamma delta
```

15. When all servers are running (it might take a while, becase RabbitMQ takes some time to start responding), open a browser window and navigate to: `http://localhost:9080/`

16. To see the four servers cooperating, keep the terminal open and see the messages coming from the different containers while you use the system. The following steps can be used to demonstrate all features:

* On the initial page, click on "Configure the Acme Air environment"
* Click on "Load the database" link on the menu
* Leave defaults and click on "Load the Database" button
* Click on "Acme Air Home" link on the menu
* Click on "Login". Leave defaults and click "Ok"
* Click on "Account", edit some fields and click on "Update Profile" button (password is "password")
* Click on "Flights" link on the menu
* Search on current date, flight from "Frankfurt" to "New York:"
* One outbound/return flight will be found, click on "select" on each one to mark them, and click on "Book Selected Flights" button.
* Click on "Checkin" link on the menu
* Click on "Select" for each flight and cancel the bookings (one at a time)

17. When you are done, stop the containers by running the following:

```sh
cd example1
docker compose down
```

18. Now let's run the same system, but on ten different servers. Duplicate the entire folder `example1` into `example2`

19. In `example2`, replace the contents of `compose.yaml` with the following:

```yaml
services:
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    # volumes:
    #   - ./database_volume:/data/db
    restart: unless-stopped
  rabbit:
    image: rabbitmq
    ports:
      - 5672:5672
      - 8080:15672
  alpha:
    build: ./distributed/alpha
    ports:
      - "9080:9080"
  beta:
    build: ./distributed/beta
    ports:
      - "3000:3000"
  gamma:
    build: ./distributed/gamma
    ports:
      - "3001:3000"
  delta:
    build: ./distributed/delta
    ports:
      - "3002:3000"
  epsilon:
    build: ./distributed/epsilon
    ports:
      - "3003:3000"
  zeta:
    build: ./distributed/zeta
    ports:
      - "3004:3000"
  eta:
    build: ./distributed/eta
    ports:
      - "3005:3000"
  theta:
    build: ./distributed/theta
    ports:
      - "3006:3000"
  iota:
    build: ./distributed/iota
    ports:
      - "3007:3000"
  kappa:
    build: ./distributed/kappa
    ports:
      - "3008:3000"
```

20. Also replace the contents of `config.yaml` with the following:

```yaml
codeGenerationParameters:
  mode: single
  inputFolder: '../acmeair-nodejs'
  outputFolder: 'distributed'
  cleanOutput: true
  generateProjects: false
  generateDocker: false
  ignore:
    - "node_modules"
    - "database_volume"
    - ".git"
rabbitParameters:
  url: rabbit
  port: 5672
  numConnectionAttempts: 5
  timeBetweenAttempts: 10
servers:
  - id: alpha
    copyFiles:
      - from: amqplib_package.json    
        to: package.json
  - id: beta
    copyFiles:
      - from: server_Dockerfile       
        to: Dockerfile  
      - from: amqplib_package.json    
        to: package.json
    http:
      url: beta
      port: 3000
    functions:
      - declarationPattern: getFlightByAirportsAndDepartureDate
        method: http-post
  - id: gamma
    copyFiles:
      - from: server_Dockerfile       
        to: Dockerfile  
      - from: amqplib_package.json    
        to: package.json
    http:
      url: gamma
      port: 3000
    functions:
      - declarationPattern: '*Session'
        method: rabbit
  - id: delta
    copyFiles:
      - from: server_Dockerfile     
        to: Dockerfile
      - from: amqplib_package.json    
        to: package.json
    http:
      url: delta
      port: 3000
    functions:
      - declarationPattern: startLoadDatabase
  - id: epsilon
    copyFiles:
      - from: server_Dockerfile     
        to: Dockerfile
      - from: amqplib_package.json    
        to: package.json
    http:
      url: epsilon
      port: 3000
    functions:
      - declarationPattern: getFlightSegmentByOriginPortAndDestPort
        method: http-post
  - id: zeta
    copyFiles:
      - from: server_Dockerfile     
        to: Dockerfile
      - from: amqplib_package.json    
        to: package.json
    http:
      url: zeta
      port: 3000
    functions:
      - declarationPattern: getBookingsByUser
        method: http-post
  - id: eta
    copyFiles:
      - from: server_Dockerfile     
        to: Dockerfile
      - from: amqplib_package.json    
        to: package.json
    http:
      url: eta
      port: 3000
    functions:
      - declarationPattern: getCustomer
  - id: theta
    copyFiles:
      - from: server_Dockerfile     
        to: Dockerfile
      - from: amqplib_package.json    
        to: package.json
    http:
      url: theta
      port: 3000
    functions:
      - declarationPattern: cancelBookingInDB
  - id: iota
    copyFiles:
      - from: server_Dockerfile     
        to: Dockerfile
      - from: amqplib_package.json    
        to: package.json
    http:
      url: iota
      port: 3000
    functions:
      - declarationPattern: countItems
        method: rabbit
  - id: kappa
    copyFiles:
      - from: server_Dockerfile     
        to: Dockerfile
      - from: amqplib_package.json    
        to: package.json
    http:
      url: kappa
      port: 3000
    functions:
      - declarationPattern: bookFlight
        method: http-post
```

21. Re-run the tool (now pointing at example2) and start the containers. Be sure to navigate back to the root folder before running the tool (if you are not there already).

```sh
cd ..
npm run js-dist-2
cd example2
docker compose up --build -d && docker compose logs -f alpha beta gamma delta epsilon zeta eta theta iota kappa
```

22. Feel free to modify the `config.yaml` to experiment with different configurations. If you find a bug, please fill an issue.

