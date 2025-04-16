import config from "../config/Configuration.js";

export const dockerfileTemplate = (serverInfo) => `
FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
${config.hasHttpFunctions(serverInfo) ? `
EXPOSE ${serverInfo.http.port}
` : ``}
CMD ["node", "src-gen/start.js"]
`;

export const composeTemplate = (serverStructures) => `
services:
${serverStructures.map(({serverInfo}) => generateService(serverInfo)).join("")}
`;

const generateService = (serverInfo) => `
    ${serverInfo.id}:
        build: ./${serverInfo.id}
${config.hasHttpFunctions(serverInfo) ? `
        ports:
            - "${serverInfo.http.port}:${serverInfo.http.port}"
` : ``}
        restart: always
`;