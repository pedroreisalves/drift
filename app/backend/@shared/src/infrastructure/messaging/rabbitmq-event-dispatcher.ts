import type { ChannelWrapper } from 'amqp-connection-manager';
import amqp from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import type EventDispatcher from '../../application/interface/event-dispatcher.interface';
import type { DomainEvent } from '../../domain/event/domain-event';

export default class RabbitMQEventDispatcher implements EventDispatcher {
  private channelWrapper: ChannelWrapper;

  constructor(
    private readonly url: string,
    private readonly exchange: string,
  ) {
    const connection = amqp.connect(this.url);

    this.channelWrapper = connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(this.exchange, 'topic', { durable: true });
      },
    });
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const routingKey = event.eventName;

    const message = JSON.stringify({
      eventName: event.eventName,
      occurredAt: event.occurredAt.toISOString(),
      payload: event.payload,
    });

    await this.channelWrapper.publish(this.exchange, routingKey, Buffer.from(message), {
      persistent: true,
      contentType: 'application/json',
    });
  }
}
