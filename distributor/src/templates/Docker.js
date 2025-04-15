export const dockerfileTemplate = (serverInfo) => `
FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${serverInfo.port}
CMD ["node", "src-gen/start.js"]
`;

export const composeTemplate = (serverStructures) => `
services:
${serverStructures.map(({serverInfo}) => generateService(serverInfo)).join("")}
`;

const generateService = (serverInfo) => `
    ${serverInfo.id}:
        build: ./${serverInfo.id}
        ports:
            - "${serverInfo.port}:${serverInfo.port}"
        restart: always
`;