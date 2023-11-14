import { BaseService } from 'medusa-interfaces'
import Pusher from 'pusher'

import loadConfig from '../helpers/config'
import { ChattingMessage } from '../modules/chatting/entities/chatting-message.entity'
import { User } from '../modules/user/entity/user.entity'

export default class PusherService extends BaseService {
  static identifier = 'pusher-service'

  private readonly pusher: Pusher
  constructor() {
    super()
    this.pusher = this.init()
  }

  public Events = {
    SENT_MESSAGE: 'chatting.sent_message',
  }

  private init(): Pusher {
    const config = loadConfig()

    return new Pusher({
      appId: config.pusher.pusher_app_id,
      key: config.pusher.pusher_app_key,
      secret: config.pusher.pusher_secret,
      cluster: config.pusher.pusher_cluster,
    })
  }

  public async pushTrigger_(receiverId: string, eventName: string, data: any) {
    await this.pusher.trigger(
      this.generatePrivateChannelName(receiverId),
      eventName,
      data,
    )
  }

  public async pushTrigger(
    receiverId: string,
    data: ChattingMessage,
  ): Promise<void> {
    await this.pusher.trigger(
      this.generatePrivateChannelName(receiverId),
      this.Events.SENT_MESSAGE,
      data,
    )
  }

  public async authenticateUser(
    socketId: string,
    user: User,
  ): Promise<Pusher.AuthResponse> {
    const channelData = {
      user_id: user.id,
      user_info: {
        type: user.type,
        store_id: user.store_id,
      },
    }
    return this.pusher.authenticate(
      socketId,
      this.generatePrivateChannelName(user.id),
      channelData,
    )
  }

  private generatePrivateChannelName(userId: string): string {
    return 'private-' + userId
  }
}
