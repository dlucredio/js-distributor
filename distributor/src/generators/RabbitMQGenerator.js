import { StringBuilder } from "./generator-utils.js";
import FunctionGenerator from "./FunctionGenerator.js";

export default class RabbitMQGenerator extends FunctionGenerator {
  constructor() {
    super();
  }

  visitFunctionDeclaration(ctx) {
    const functionName = ctx.identifier().getText();
    const functionInfo = this.functions.find((func) => func.name === functionName);
    const server = this.servers.find((s) => s.id === functionInfo.server);
    const paramNames = functionInfo.parameters.map((param) => param.name).join(', ');
    const connectionUrl = server.rabbitmq.connectionUrl || 'amqp://localhost';
    if (functionInfo && server && server.rabbitmq) {
      const exchange = server.rabbitmq.exchange;
      const queue = server.rabbitmq.queue;

      this.appendString(`const express = require('express');`);
      this.appendString(`const amqp = require('amqplib');`);
      this.appendString(`const bodyParser = require('body-parser');`);
      this.appendString();
      this.appendString(`const app = express();`);
      this.appendString(`const port = ${ 3000};`);
      this.appendString();
      this.appendString(`app.use(bodyParser.json());`);
      this.appendString();

      this.appendString(`async function publishToRabbitMQ(message) {`);
      this.appendString(`const connection = await amqp.connect('${connectionUrl}');`);
      this.appendString(`  const channel = await connection.createChannel();`);
      this.appendString(`  await channel.assertExchange('${exchange}', 'fanout', { durable: false });`);
      this.appendString(`  await channel.assertQueue('${queue}', { durable: false });`);
      this.appendString(`  await channel.bindQueue('${queue}', '${exchange}', '');`);
      this.appendString(`  channel.sendToQueue('${queue}', Buffer.from(JSON.stringify(message)));`);
      this.appendString(`  setTimeout(() => connection.close(), 500);`);
      this.appendString(`}`);
      this.appendNewLine();

      this.appendString(`async function consumeFromRabbitMQ(callback) {`);
      this.appendString(`const connection = await amqp.connect('${connectionUrl}');`);
      this.appendString(`  const channel = await connection.createChannel();`);
      this.appendString(`  await channel.assertQueue('${queue}', { durable: false });`);
      this.appendString(`  channel.consume('${queue}', (msg) => {`);
      this.appendString(`    if (msg) {`);
      this.appendString(`      const message = JSON.parse(msg.content.toString());`);
      this.appendString(`      callback(message);`);
      this.appendString(`    }`);
      this.appendString(`  }, { noAck: true });`);
      this.appendString(`}`);
      this.appendNewLine();

      this.appendString(`app.post('/publish', async (req, res) => {`);
      this.appendString(`  try {`);
      if(paramNames != undefined && paramNames != null){
        this.appendString(`const { ${paramNames} }= req.body`)
      }
      this.appendString(`    const { message } = await ${functionName}(${paramNames});`);
      this.appendString(`const exchange = ${exchange};`);
      this.appendString(`const queue = ${queue};`);
      this.appendString(`    await publishToRabbitMQ({message}, exchange, queue);`);
      this.appendString(`    res.json({ message });`);
      this.appendString(`  } catch (error) {`);
      this.appendString(`    res.status(500).send('Error publishing message to RabbitMQ.');`);
      this.appendString(`  }`);
      this.appendString(`});`);
      this.appendNewLine();

      this.appendString(`app.get('/consume', (req, res) => {`);
      this.appendString(`  try {`);
      this.appendString(`    consumeFromRabbitMQ((message) => {`);
      this.appendString(`      res.json(message);`);
      this.appendString(`    }, ${queue});`);
      this.appendString(`  } catch (error) {`);
      this.appendString(`    res.status(500).send('Error consuming message from RabbitMQ.');`);
      this.appendString(`  }`);
      this.appendString(`});`);
      this.appendNewLine();

      this.appendString(`app.listen(port, () => {`);
      this.appendString(`  console.log(\`Server listening at http://localhost:${3000}\`);`);
      this.appendString(`});`);
      this.appendNewLine();
    
      this.appendString(`async function ${functionName}(${paramNames})`)
      this.appendString("{")
      if (ctx.functionBody()) {
        this.visitFunctionBody(ctx.functionBody());
        }
      this.appendString("}") 

    } else {
      console.error(`Configuração RabbitMQ não encontrada para o servidor "${functionInfo.server}".`);
    }
  }
}


