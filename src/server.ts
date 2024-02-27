import { config } from '@notifications/config';
import { IEmailMessageDetails, winstonLogger } from '@Zephyr-Jeon/jobber-shared';
import { Channel } from 'amqplib';
import { Application } from 'express';
import 'express-async-errors';
import http from 'http';
import { Logger } from 'winston';
import { checkConnection } from './elasticsearch';
import { createConnection } from './queues/connection';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from './queues/email.consumer';
import { healthRoutes } from './routes';

const SERVER_PORT = 4001;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

export function start(app: Application): void {
  startServer(app);
  app.use('', healthRoutes());
  startQueues();
  startElasticSearch();
}

async function startQueues(): Promise<void> {
  const emailChannel: Channel = (await createConnection()) as Channel;
  await consumeAuthEmailMessages(emailChannel);
  await consumeOrderEmailMessages(emailChannel);

  // testing
  // const verificationLink = `${config.SENDER_EMAIL}/confirm_email?v_token=1234random`;
  // const messageDetails: IEmailMessageDetails = {
  //   receiverEmail: `${config.SENDER_EMAIL}`,
  //   verifyLink: verificationLink,
  //   template: 'verifyEmail'
  // };
  // emailChannel.publish('jobber-email-notification', 'auth-email', Buffer.from(JSON.stringify(messageDetails)));
  // emailChannel.publish('jobber-order-notification', 'order-email', Buffer.from(JSON.stringify({ name: 'order message' })));
}

function startElasticSearch(): void {
  checkConnection();
}

function startServer(app: Application): void {
  try {
    const httpServer: http.Server = new http.Server(app);
    log.info(`Worker with process id of ${process.pid} on notification server has started`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Notification server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.log('error', 'NotificationService startServer() method:', error);
  }
}
