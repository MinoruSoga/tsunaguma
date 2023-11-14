import { eventEmitter, OnMedusaEntityEvent, Utils } from 'medusa-extender'
import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm'

import { Image } from '../entity/image.entity'

@EventSubscriber()
export default class ImageSubscriber
  implements EntitySubscriberInterface<Image>
{
  static attachTo(connection: Connection): void {
    Utils.attachOrReplaceEntitySubscriber(connection, ImageSubscriber)
  }

  public listenTo(): typeof Image {
    return Image
  }

  /**
   * Relay the event to the handlers.
   * @param event Event to pass to the event handler
   */
  public async beforeInsert(event: InsertEvent<Image>): Promise<void> {
    return await eventEmitter.emitAsync(
      OnMedusaEntityEvent.Before.InsertEvent(Image),
      {
        event,
        transactionalEntityManager: event.manager,
      },
    )
  }
}
