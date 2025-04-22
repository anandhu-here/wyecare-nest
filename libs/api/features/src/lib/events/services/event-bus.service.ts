import { Injectable, Logger } from '@nestjs/common';
import { Event } from '../interfaces/event.interface';

type EventHandler = (event: Event) => void;

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private handlers = new Map<string, EventHandler[]>();

  publish(event: Event): void {
    this.logger.debug(`Publishing event: ${event.type}`);
    const handlers = this.handlers.get(event.type) || [];

    if (handlers.length === 0) {
      this.logger.debug(`No handlers registered for event: ${event.type}`);
    } else {
      this.logger.debug(
        `Found ${handlers.length} handlers for event: ${event.type}`
      );
    }

    handlers.forEach((handler) => handler(event));
  }

  subscribe(eventType: string, handler: EventHandler): void {
    this.logger.debug(`Subscribing to event: ${eventType}`);
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }
}
