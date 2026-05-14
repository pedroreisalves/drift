import type { ChannelWrapper } from 'amqp-connection-manager';
import amqp from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import type EventConsumer from '../../application/interface/event-consumer.interface';
import type EventHandler from '../../application/interface/event-handler.interface';
import type Logger from '../../application/interface/logger.interface';

export default class RabbitMQEventConsumer implements EventConsumer {
  private channelWrapper: ChannelWrapper;
  private readonly handlers: Map<string, EventHandler> = new Map();

  constructor(
    private readonly url: string,
    private readonly exchange: string,
    private readonly serviceName: string,
    private readonly logger: Logger,
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

      await channel.consume(queueName, (message: ConsumeMessage | null) => {
        if (!message) return;

        const processMessage = async (): Promise<void> => {
          const event = JSON.parse(message.content.toString()) as { eventName: string };
          const registeredHandler = this.handlers.get(event.eventName);

          if (registeredHandler) {
            await registeredHandler.handle(event);
          }

          channel.ack(message);
        };

        processMessage().catch((error: unknown) => {
          this.logger.error('Failed to process message, requeuing', {
            eventName,
            error: error instanceof Error ? error.message : String(error),
          });
          channel.nack(message, false, true);
        });
      });
    });
  }
}
