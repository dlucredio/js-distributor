FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001

CMD ["node", "src-gen/start.js"]