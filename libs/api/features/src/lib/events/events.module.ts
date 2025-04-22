import { Module } from '@nestjs/common';
import { EventBusService } from './services/event-bus.service';

@Module({
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventsModule {}
