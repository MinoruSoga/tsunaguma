import { Module } from 'medusa-extender'

import { EventBusService } from './event-bus.service'

@Module({
  imports: [EventBusService],
})
export class EventModule {}
