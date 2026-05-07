import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import EventConsumer from '../../application/@shared/interface/event-consumer.interface';
import EventHandler from '../../application/@shared/interface/event-handler.interface';

export default class RabbitMQEventConsumer implements EventConsumer {
  private channelWrapper: ChannelWrapper;
  private readonly handlers: Map<string, EventHandler> = new Map();

  constructor(
    private readonly url: string,
    private readonly exchange: string,
    private readonly serviceName: string,
  ) {
    const connection = amqp.connect(this.url);

    this.channelWrapper = connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(this.exchange, 'topic', { durable: true });
      },
    });
  }

  async subscribe(eventName: string, handler: EventHandler): Promise<void> {
    this.handlers.set(eventName, handler);

    const queueName = `${this.serviceName}.${eventName}`;

    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.assertQueue(queueName, { durable: true });
      await channel.bindQueue(queueName, this.exchange, eventName);

      await channel.consume(queueName, async (message: ConsumeMessage | null) => {
        if (!message) return;

        try {
          const event = JSON.parse(message.content.toString());
          const registeredHandler = this.handlers.get(event.eventName);

          if (registeredHandler) {
            await registeredHandler.handle(event);
          }

          channel.ack(message);
        } catch (error) {
          console.error(`Failed to process ${eventName}:`, error);
          channel.nack(message, false, false);
        }
      });
    });
  }
}
