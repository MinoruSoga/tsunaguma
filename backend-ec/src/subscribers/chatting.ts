import { EventBusService } from '@medusajs/medusa/dist/services'

import { ChattingService } from '../modules/chatting/chatting.service'

type InjectedDependencies = {
  eventBusService: EventBusService
  chattingService: ChattingService
}

export default class ChattingSubscriber {
  protected chattingService: ChattingService

  constructor({ chattingService, eventBusService }: InjectedDependencies) {
    this.chattingService = chattingService
    eventBusService.subscribe(
      ChattingService.Events.SENT_MESSAGE,
      this.handleAfterSentMessage,
    )
  }

  handleAfterSentMessage = async (data) => {
    await this.chattingService.sentMessage(data)
  }
}
