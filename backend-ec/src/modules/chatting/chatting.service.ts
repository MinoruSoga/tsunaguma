import { TransactionBaseService } from '@medusajs/medusa'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import dayjs from 'dayjs'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import Pusher from 'pusher'
import { Brackets, EntityManager, IsNull, Not } from 'typeorm'
import { DeepPartial } from 'typeorm/common/DeepPartial'

import loadConfig from '../../helpers/config'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../interfaces/email-template'
import { PaginationType } from '../../interfaces/pagination'
import PusherService from '../../services/pusher.service'
import { NotificationType } from '../notification/entities/notification.entity'
import { Store, StorePlanType } from '../store/entity/store.entity'
import StoreRepository from '../store/repository/store.repository'
import { User } from '../user/entity/user.entity'
import { CustomerRepository } from '../user/repository/customer.repository'
import UserRepository from '../user/user.repository'
import { NotificationTemplateData } from './../../interfaces/notification-template'
import { GetListThreadCmsBody } from './controllers/chatting-thread.cms.admin.controller'
import {
  ChattingMessage,
  MessageTypes,
  ReadStatus,
} from './entities/chatting-message.entity'
import {
  ChattingThread,
  detectThreadId,
  ThreadIdDetected,
} from './entities/chatting-thread.entity'
import { ChattingThreadPined } from './entities/chatting-thread-pined.entity'
import { ChattingMessageRepository } from './repositories/chatting-message.repository'
import { ChattingThreadRepository } from './repositories/chatting-thread.repository'
import { ChattingThreadPinedRepository } from './repositories/chatting-thread-pined.repository'

interface InjectedDependencies {
  manager: EntityManager
  chattingThreadRepository: typeof ChattingThreadRepository
  chattingMessageRepository: typeof ChattingMessageRepository
  chattingThreadPinedRepository: typeof ChattingThreadPinedRepository
  storeRepository: typeof StoreRepository
  eventBusService: EventBusService
  userRepository: typeof UserRepository
  customerRepository: typeof CustomerRepository
}

@Service()
export class ChattingService
  extends TransactionBaseService
  implements IEmailTemplateDataService
{
  static resolutionKey = 'chattingService'

  protected readonly manager_: EntityManager

  protected readonly transactionManager_: EntityManager

  private readonly chattingThreadRepository_: typeof ChattingThreadRepository

  private readonly chattingMessageRepository_: typeof ChattingMessageRepository

  private readonly chattingThreadPinedRepository_: typeof ChattingThreadPinedRepository

  private readonly storeRepository_: typeof StoreRepository
  private userRepository: typeof UserRepository
  private readonly customerRepository: typeof CustomerRepository

  protected readonly eventBus_: EventBusService

  protected readonly pusherService_: PusherService

  static Events = {
    SENT_MESSAGE: 'chatting.sent_message',
    RECEIVE_MESSAGE: 'chatting.receive_message',
    SEND_CHAT_MAIL: 'chatting.send_chat_mail',
  }

  constructor(private readonly container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.chattingThreadRepository_ = container.chattingThreadRepository
    this.chattingMessageRepository_ = container.chattingMessageRepository
    this.chattingThreadPinedRepository_ =
      container.chattingThreadPinedRepository
    this.storeRepository_ = container.storeRepository
    this.eventBus_ = container.eventBusService
    this.userRepository = container.userRepository
    this.customerRepository = container.customerRepository
    this.pusherService_ = new PusherService()
  }

  public async listThread(
    userId: string,
    readStatus: ReadStatus,
    limit: number,
    skip: number,
  ): Promise<PaginationType<ChattingThread>> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )

    const chattingMessageRepo = this.manager_.getCustomRepository(
      this.chattingMessageRepository_,
    )

    const qb = chattingThreadRepo.createQueryBuilder('chatting_thread')
    qb.innerJoinAndSelect('chatting_thread.store', 'store')
    qb.innerJoinAndSelect('chatting_thread.user', 'user')
    qb.leftJoinAndSelect(
      'chatting_thread.chatting_thread_pined',
      'chatting_thread_pined',
      'chatting_thread.id = chatting_thread_pined.chatting_thread_id AND chatting_thread_pined.user_id = :userId',
      { userId: userId },
    )

    // soft delete
    qb.where('chatting_thread.deleted_at is NULL')

    if (readStatus === ReadStatus.UN_READ) {
      qb.andWhere(
        new Brackets((query) => {
          query
            .where(
              'chatting_thread.user_id = :id AND chatting_thread.user_read = :isRead',
              { id: userId, isRead: false },
            )
            .orWhere(
              'store.owner_id = :id AND chatting_thread.store_read = :isRead',
              { id: userId, isRead: false },
            )
        }),
      ).andWhere(
        new Brackets((query) => {
          query.where('chatting_thread.last_message_at IS NOT NULL')
        }),
      )
    } else if (readStatus === ReadStatus.READ) {
      qb.andWhere(
        new Brackets((query) => {
          query
            .where(
              'chatting_thread.user_id = :id AND chatting_thread.user_read = :isRead',
              { id: userId, isRead: true },
            )
            .orWhere(
              'store.owner_id = :id AND chatting_thread.store_read = :isRead',
              { id: userId, isRead: true },
            )
        }),
      ).andWhere(
        new Brackets((query) => {
          query.where('chatting_thread.last_message_at IS NOT NULL')
        }),
      )
    } else {
      //case: readStatus = all
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('chatting_thread.user_id = :id', {
              id: userId,
            })
            .orWhere('store.owner_id = :id', {
              id: userId,
            })
        }),
      ).andWhere(
        new Brackets((query) => {
          query.where('chatting_thread.last_message_at IS NOT NULL')
        }),
      )
    }

    const [chattingThreads, count] = await qb
      .orderBy('chatting_thread_pined.updated_at')
      .addOrderBy('chatting_thread.last_message_at', 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount()

    const results: ChattingThread[] = await Promise.all(
      chattingThreads.map(async (item): Promise<ChattingThread> => {
        const countMes = await chattingMessageRepo.count({
          chatting_thread_id: item.id,
        })
        item.count = countMes
        return item
      }),
    )
    return {
      items: [...results],
      count,
    }
  }

  public async listThreadCms(
    data: GetListThreadCmsBody,
  ): Promise<PaginationType<ChattingThread>> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )

    const chattingMessageRepo = this.manager_.getCustomRepository(
      this.chattingMessageRepository_,
    )

    const cusRepo = this.manager_.getCustomRepository(this.customerRepository)

    const qb = chattingThreadRepo.createQueryBuilder('chatting_thread')
    qb.innerJoinAndSelect('chatting_thread.store', 'store')
    qb.innerJoinAndSelect('chatting_thread.user', 'user')
    qb.leftJoinAndSelect('chatting_thread.author', 'author')
    qb.leftJoinAndSelect('author.customer', 'customer')
    qb.leftJoinAndSelect(
      'chatting_thread.chatting_message',
      'message',
      'chatting_thread.id = message.chatting_thread_id',
    )
    qb.leftJoinAndSelect(
      'chatting_thread.chatting_thread_pined',
      'chatting_thread_pined',
      'chatting_thread.id = chatting_thread_pined.chatting_thread_id',
    )

    // soft delete
    qb.where('chatting_thread.deleted_at is NULL')
    qb.andWhere('message.deleted_at is NULL')
    qb.andWhere(
      "1 = 1 AND last_message IS NOT NULl AND store.plan_type = 'prime'",
    )
    if (data.customer_id) {
      qb.andWhere('customer.display_id = :customerId', {
        customerId: data.customer_id,
      })
    }

    if (data.display_id) {
      qb.andWhere('chatting_thread.display_id = :displayId', {
        displayId: data.display_id,
      })
    }

    if (data.nickname) {
      qb.andWhere('user.nickname like :nickname', {
        nickname: `%${data.nickname}%`,
      })
    }

    if (data.store_id) {
      qb.andWhere('store.display_id = :storeId', {
        storeId: data.store_id,
      })
    }

    if (data.store_name) {
      qb.andWhere('store.name like :storeName', {
        storeName: `%${data.store_name}%`,
      })
    }

    if (data.user_email) {
      qb.andWhere('user.email like :email', {
        email: `%${data.user_email}%`,
      })
    }

    if (data.store_email) {
      const stores = await this.getListUsers(data.store_email)
      const owner_ids = stores.map((s: User) => s.id)
      qb.andWhere('store.owner_id IN (:...owner_ids)', { owner_ids })
    }

    if (data.sent_time_from && data.sent_time_to) {
      qb.andWhere(
        "to_char(chatting_thread.updated_at, 'HH24:MI') BETWEEN :fromTime AND :toTime",
        {
          fromTime: data.sent_time_from,
          toTime: data.sent_time_to,
        },
      )
    } else if (data.sent_time_from) {
      qb.andWhere(
        "to_char(chatting_thread.updated_at, 'HH24:MI') >= :fromTime",
        {
          fromTime: data.sent_time_from,
        },
      )
    } else if (data.sent_time_to) {
      qb.andWhere("to_char(chatting_thread.updated_at, 'HH24:MI') <= :toTime", {
        toTime: data.sent_time_to,
      })
    }

    if (data.sent_date_from && data.sent_date_to) {
      qb.andWhere(
        "to_char(chatting_thread.updated_at, 'YYYY-MM-DD') BETWEEN :from AND :to",
        {
          from: dayjs(data.sent_date_from).format('YYYY-MM-DD'),
          to: dayjs(data.sent_date_to).format('YYYY-MM-DD'),
        },
      )
    } else if (data.sent_date_from) {
      qb.andWhere(
        "to_char(chatting_thread.updated_at, 'YYYY-MM-DD') >= :from",
        {
          from: dayjs(data.sent_date_from).format('YYYY-MM-DD'),
        },
      )
    } else if (data.sent_date_to) {
      qb.andWhere("to_char(chatting_thread.updated_at, 'YYYY-MM-DD') <= :to", {
        to: dayjs(data.sent_date_to).format('YYYY-MM-DD'),
      })
    }

    const statusCond: string[] = []

    if (data.status?.length && data.status.includes(ReadStatus.TREATED)) {
      statusCond.push(`chatting_thread.store_read = true and chatting_thread.last_message_by = message.sender_id and (chatting_thread.last_message = message.metadata ->> 'message' or chatting_thread.last_message like message.metadata ->> 'message')`)
    }

    if (data.status?.length && data.status.includes(ReadStatus.UN_READ)) {
      statusCond.push(`chatting_thread.store_read = false`)
    }

    if (data.status?.length && data.status.includes(ReadStatus.UN_TREATED)) {
      const compareDay = dayjs().subtract(8, 'days').format('YYYY-MM-DD HH:mm:ss')

      if (data.unprocessed_days?.length && data.unprocessed_days === '<8') {
        qb.andWhere("chatting_thread.last_message_at > :days", {
          days: compareDay,
        })
      } else {
        qb.andWhere("chatting_thread.last_message_at <= :days", {
          days: compareDay,
        })
      }
      statusCond.push(`chatting_thread.store_read = true and chatting_thread.user_id = message.sender_id and (chatting_thread.last_message = message.metadata ->> 'message' or chatting_thread.last_message like message.metadata ->> 'message')`)
    }

    if (statusCond?.length) {
      qb.andWhere(`(${statusCond.join(' or ')})`)
    }

    if (data.free_word) {
      const freeWord = data.free_word
      const isTxt = isNaN(Number(data.free_word))
      const equalNumb = [
        'customer.display_id',
        'store.display_id',
        'chatting_thread.display_id',
      ]
      const likeTxts = ['user.nickname', 'store.name']

      const qbNumb = equalNumb.map((eq) => `${eq} = '${freeWord}'`)
      const qbTxt = likeTxts.map((eq) => `${eq} LIKE '%${freeWord}%'`)

      if (isTxt) {
        qb.andWhere(`( ${qbTxt.join(' OR ')} )`)
      } else {
        const qbFreeWord = qbNumb.concat(qbTxt).join(' OR ')
        qb.andWhere(`( ${qbFreeWord} )`)
      }
    }

    const attachedCond: string[] = []

    if (data.attached?.length && data.attached?.includes('attached')) {
      attachedCond.push("message.metadata ->>'type' != 'string'")
    }
    if (data.attached?.length && data.attached?.includes('none_attached')) {
      attachedCond.push(
        "(message.metadata ->>'type' = 'string' or message is NULL)",
      )
    }

    if (attachedCond?.length) {
      qb.andWhere(`(${attachedCond.join(' or ')})`)
    }

    const [chattingThreads, count] = await qb
      .orderBy('chatting_thread_pined.value')
      .orderBy('chatting_thread.last_message_at', 'DESC')
      .take(data.limit)
      .skip(data.offset)
      .getManyAndCount()

    const results: ChattingThread[] = await Promise.all(
      chattingThreads.map(async (item): Promise<ChattingThread> => {
        const countMes = await chattingMessageRepo.count({
          chatting_thread_id: item.id,
          deleted_at: IsNull(),
        })
        const user = await cusRepo.findOne(item.user_id)
        const author = await cusRepo.findOne(item.last_message_by)
        item.count = countMes
        item.metadata = {
          user_display_id: user.display_id,
          author_display_id: author?.display_id || null,
        }
        return item
      }),
    )
    return {
      items: [...results],
      count,
    }
  }

  public async getListUsers(email: string): Promise<User[]> {
    const userRepo = this.manager_.getCustomRepository(this.userRepository)
    const qb = userRepo.createQueryBuilder('user')

    qb.where('email like :email', {
      email: `%${email}%`,
    })

    qb.select('id')

    return await qb.getRawMany()
  }

  public async messages(
    userId: string,
    id: string,
    limit: number,
    skip: number,
  ): Promise<[ChattingMessage[], number]> {
    await this.validateThread(id, userId)

    const chattingMessageRepo = this.manager_.getCustomRepository(
      this.chattingMessageRepository_,
    )

    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )

    await chattingThreadRepo.update(
      { id: id },
      {
        store_read: true
      },
    )

    const qb = chattingMessageRepo.createQueryBuilder('chatting_message')
    qb.innerJoinAndSelect('chatting_message.chatting_thread', 'chatting_thread')
    qb.innerJoinAndSelect('chatting_message.sender', 'sender')

    // soft delete
    qb.where('chatting_message.deleted_at is NULL')

    qb.andWhere('chatting_thread_id = :id', {
      id,
    })

    return await qb
      .orderBy('chatting_message.created_at', 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount()
  }

  private async validateThread(
    threadId: string,
    userId: string,
  ): Promise<ChattingThread> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )

    const qbThread = chattingThreadRepo.createQueryBuilder('chatting_thread')
    qbThread.innerJoinAndSelect('chatting_thread.store', 'store')
    qbThread.innerJoinAndSelect('chatting_thread.user', 'user')

    qbThread.where(
      new Brackets((query) => {
        query
          .where('chatting_thread.user_id = :id', {
            id: userId,
          })
          .orWhere('store.owner_id = :id', {
            id: userId,
          })
      }),
    )
    qbThread.where('chatting_thread.id = :id', { id: threadId })

    const chattingThread = await qbThread.getOne()
    if (!chattingThread) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Chatting thread not found!',
      )
    }

    return chattingThread
  }

  public async sendMessage(
    message: string,
    type: MessageTypes,
    threadId: string,
    userId: string,
  ): Promise<ChattingMessage> {
    const chattingThread = await this.createChattingThread(threadId, userId)

    // thread => user_id, store_id
    const chattingMessage: DeepPartial<ChattingMessage> = {
      chatting_thread_id: threadId,
      sender_id: userId,
      metadata: {
        message,
        type,
      },
    }

    const chattingMessageRepo = this.manager_.getCustomRepository(
      this.chattingMessageRepository_,
    )
    const chattingMessageCreate: ChattingMessage =
      await chattingMessageRepo.save(
        chattingMessageRepo.create(chattingMessage),
      )

    const eventData: SentMessageEvent = {
      chatting_message: chattingMessageCreate,
      message_type: type,
      message_content: message,
      user_id: userId, // the buyer id (customer or shop)
      store_id: chattingThread.store_id,
      last_message_by: userId,
    }

    const res = await chattingMessageRepo.save(chattingMessageCreate)
    await this.eventBus_.emit(ChattingService.Events.SENT_MESSAGE, eventData)

    await this.sendChatNotification(chattingThread, userId, { message, type })
    return res
  }

  private async sendChatNotification(
    chattingThread: ChattingThread,
    userId: string,
    chatData: { message: string; type: MessageTypes },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { message, type } = chatData
    const userRepo = this.manager_.getCustomRepository(this.userRepository)
    const storeRepo = this.manager_.getCustomRepository(this.storeRepository_)
    const buyer = await userRepo.findOne(chattingThread.user_id, {
      select: ['id', 'nickname', 'avatar', 'email'],
    })
    const shop = await storeRepo.findOne(chattingThread.store_id, {
      select: ['id', 'name', 'owner_id', 'avatar', 'plan_type'],
      relations: ['owner'],
    })

    const isFromBuyer = userId === chattingThread.user_id

    const notificationTo = isFromBuyer ? shop.owner_id : chattingThread.user_id
    const config = loadConfig()

    const notiEventData = {
      message: isFromBuyer
        ? `${buyer.nickname}様からメッセージが届いています
`
        : `${shop.name}さんからメッセージが届いています`,
      id: notificationTo,
      customer_id: notificationTo,
      type: NotificationType.NOTIFICATION,
      link: config.frontendUrl.chattingThread(chattingThread.id),
      avatar: isFromBuyer ? buyer.avatar : shop.avatar,
    }

    const email = isFromBuyer
      ? shop.plan_type === StorePlanType.PRIME
        ? config.email.email_admin
        : shop.owner.email
      : buyer.email
    const format = isFromBuyer
      ? 'shop-message-reception'
      : 'buyer-message-reception'
    const emailData = {
      ownerName:
        shop.plan_type === StorePlanType.PRIME
          ? config.email.email_admin
          : shop.owner.nickname,
      storeName: shop.name,
      buyerName: buyer.nickname,
      messageContent: message,
      chattingThreadLink: config.frontendUrl.chattingThread(
        `${buyer.id}-${shop.id}`,
      ),
    }
    const emailEventData = {
      id: notificationTo,
      email,
      format,
      customer_id: isFromBuyer
        ? shop.plan_type === StorePlanType.PRIME
          ? null
          : shop.owner.id
        : buyer.id,
      ...emailData,
    }

    await this.eventBus_.emit(
      ChattingService.Events.RECEIVE_MESSAGE,
      notiEventData,
    )

    await this.eventBus_.emit(
      ChattingService.Events.SEND_CHAT_MAIL,
      emailEventData,
    )
  }

  private async createChattingThread(
    threadId: string,
    userId: string,
  ): Promise<ChattingThread> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )
    const chattingThread = await chattingThreadRepo
      .createQueryBuilder('chatting_thread')
      .innerJoinAndSelect('chatting_thread.store', 'store')
      .innerJoinAndSelect('chatting_thread.user', 'user')
      .where(
        new Brackets((query) => {
          query
            .where('chatting_thread.user_id = :id', {
              id: userId,
            })
            .orWhere('store.owner_id = :id', {
              id: userId,
            })
        }),
      )
      .where('chatting_thread.id = :id', { id: threadId })
      .getOne()

    if (!chattingThread) {
      const threadIdDetected: ThreadIdDetected = detectThreadId(threadId)
      await this.validateThreadId(threadIdDetected, userId)

      const chattingThreadCreate: DeepPartial<ChattingThread> = {
        user_id: threadIdDetected.userId,
        store_id: threadIdDetected.storeId,
      }

      return await chattingThreadRepo.save(
        chattingThreadRepo.create(chattingThreadCreate),
      )
    } else {
      await chattingThreadRepo.update(threadId, {
        deleted_at: null,
      })

      return chattingThread
    }
  }

  private async validateThreadId(
    threadIdData: ThreadIdDetected,
    userId: string,
  ): Promise<void> {
    const currentUserId: string = userId
    const storeRepo = this.manager_.getCustomRepository(this.storeRepository_)
    const store: Store = await storeRepo
      .createQueryBuilder('chatting_thread')
      .where('id = :id', { id: threadIdData.storeId })
      .getOne()

    if (!store) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store not found!')
    }

    // if (threadIdData.userId === store.owner_id) {
    //   throw new MedusaError(
    //     MedusaError.Types.INVALID_DATA,
    //     'Chatting Thread Id wrong format!',
    //   )
    // }

    if (
      currentUserId !== threadIdData.userId &&
      currentUserId !== store.owner_id
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Chatting Thread Id wrong format!',
      )
    }
  }

  public async pinChattingThread(
    threadId: string,
    userId: string,
  ): Promise<void> {
    await this.validateThread(threadId, userId)

    const chattingThreadPinedRepo = this.manager_.getCustomRepository(
      this.chattingThreadPinedRepository_,
    )
    const qb = chattingThreadPinedRepo.createQueryBuilder(
      'chatting_thread_pined',
    )
    qb.where(
      'chatting_thread_pined.chatting_thread_id = :threadId and chatting_thread_pined.user_id = :userId',
      {
        threadId: threadId,
        userId: userId,
      },
    )

    const chattingThreadPined = await qb.getOne()

    if (!chattingThreadPined) {
      const data: DeepPartial<ChattingThreadPined> = {
        chatting_thread_id: threadId,
        user_id: userId,
        value: 1,
      }

      const chattingThreadPinedCreate = chattingThreadPinedRepo.create(data)
      await chattingThreadPinedRepo.save(chattingThreadPinedCreate)

      return
    }

    await chattingThreadPinedRepo.remove(chattingThreadPined)
  }

  public async sentMessage(data: SentMessageEvent): Promise<void> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )
    const qbThread = chattingThreadRepo.createQueryBuilder('chatting_thread')
    qbThread.innerJoinAndSelect('chatting_thread.store', 'store')
    qbThread.where('chatting_thread.id = :id', {
      id: data.chatting_message.chatting_thread_id,
    })
    const chattingThread: ChattingThread = await qbThread.getOne()
    if (!chattingThread) {
      return
    }
    let receiverId: string
    if (chattingThread.user_id === data.user_id) {
      chattingThread.store_read = false
      receiverId = chattingThread.store.owner_id
    } else {
      chattingThread.user_read = false
      receiverId = chattingThread.user_id
    }

    if (data.message_type === MessageTypes.STRING) {
      chattingThread.last_message = data.message_content
    } else if (data.message_type === MessageTypes.IMAGE) {
      chattingThread.last_message = `{"imageUrl":"${data.message_content}"}`
    }
    chattingThread.last_message_at = new Date()
    chattingThread.last_message_by = data.last_message_by
    await chattingThreadRepo.save(chattingThread)

    //Send trigger to pusher
    await this.pusherService_.pushTrigger(receiverId, data.chatting_message)
  }

  public async markReadMessage(
    threadId: string,
    userId: string,
  ): Promise<void> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )
    const chattingThread: ChattingThread = await this.validateThread(
      threadId,
      userId,
    )
    if (chattingThread.user_id === userId) {
      chattingThread.user_read = true
    } else {
      chattingThread.store_read = true
    }

    await chattingThreadRepo.save(chattingThread)
  }

  public async chattingThread(
    threadId: string,
    userId: string,
  ): Promise<ChattingThread> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )
    const qbThread = chattingThreadRepo.createQueryBuilder('chatting_thread')
    qbThread.innerJoinAndSelect('chatting_thread.store', 'store')
    qbThread.innerJoinAndSelect('chatting_thread.user', 'user')
    qbThread.leftJoinAndSelect(
      'chatting_thread.chatting_thread_pined',
      'chatting_thread_pined',
      'chatting_thread.id = chatting_thread_pined.chatting_thread_id AND chatting_thread_pined.user_id = :userId',
      { userId: userId },
    )

    // soft delete
    // qbThread.where('chatting_thread.deleted_at is NULL')

    qbThread.andWhere('chatting_thread.id = :threadId', { threadId: threadId })
    qbThread.andWhere(
      new Brackets((query) => {
        query
          .where('chatting_thread.user_id = :id', {
            id: userId,
          })
          .orWhere('store.owner_id = :id', {
            id: userId,
          })
      }),
    )

    let chattingThread = await qbThread.getOne()
    if (!chattingThread) {
      await this.createChattingThread(threadId, userId)
      // response needs to return stores and users
      chattingThread = await qbThread.getOne()
    }

    return chattingThread
  }

  public async chattingThreadCms(threadId: string): Promise<ChattingThread> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )

    const qbThread = chattingThreadRepo.createQueryBuilder('chatting_thread')
    qbThread.innerJoinAndSelect('chatting_thread.store', 'store')
    qbThread.innerJoinAndSelect('chatting_thread.user', 'user')
    qbThread.leftJoinAndSelect('chatting_thread.author', 'customer')
    qbThread.leftJoinAndSelect(
      'chatting_thread.chatting_thread_pined',
      'chatting_thread_pined',
      'chatting_thread.id = chatting_thread_pined.chatting_thread_id and user.id = chatting_thread.user_id and store.id = chatting_thread.store_id',
    )

    // soft delete
    qbThread.where('chatting_thread.deleted_at is NULL')
    qbThread.where('chatting_thread.id = :threadId', { threadId: threadId })

    let chattingThread = await qbThread.getOne()
    if (!chattingThread) {
      const userRepo = this.manager_.getCustomRepository(this.userRepository)
      const storeId = threadId.substring(threadId.indexOf('-') + 1)
      const user = await userRepo.findOne({ where: { store_id: storeId } })
      await this.createChattingThread(threadId, user.id)
      // response needs to return stores and users
      chattingThread = await qbThread.getOne()
    }

    return chattingThread
  }

  public async authenticationPusher(
    socketId: string,
    currentUser: User,
  ): Promise<Pusher.AuthResponse> {
    return await this.pusherService_.authenticateUser(socketId, currentUser)
  }

  async genNotificationData(
    event: string,
    data: any,
  ): Promise<NotificationTemplateData> {
    return {
      to: data.id,
      data: data,
    }
  }

  async genEmailData(event: string, data: any): Promise<EmailTemplateData> {
    return {
      to: [data.email],
      format: data.format,
      data,
      customer_id: data.customer_id ?? null,
    }
  }

  public async totalUnreadChattingThread(
    userId: string,
  ): Promise<{ total: number }> {
    const chattingThreadRepo = this.manager_.getCustomRepository(
      this.chattingThreadRepository_,
    )
    const userRepo = this.manager_.getCustomRepository(this.userRepository)
    const user = await userRepo.findOne(userId)
    let totalThreadStore = 0
    if (user.store_id) {
      totalThreadStore = await chattingThreadRepo.count({
        store_id: user.store_id,
        store_read: false,
        last_message: Not(IsNull()),
        deleted_at: IsNull(),
      })
    }
    const totalThreadUser = await chattingThreadRepo.count({
      user_id: userId,
      user_read: false,
      last_message: Not(IsNull()),
      deleted_at: IsNull(),
    })
    return { total: totalThreadStore + totalThreadUser }
  }

  async deleteChattingThread(threadId: string) {
    const now = dayjs()

    return this.atomicPhase_(async (tx) => {
      const chattingThreadRepo = tx.getCustomRepository(
        this.chattingThreadRepository_,
      )

      const chattingMessageRepo = tx.getCustomRepository(
        this.chattingMessageRepository_,
      )

      const chattingThreadPinedRepo = tx.getCustomRepository(
        this.chattingThreadPinedRepository_,
      )

      await chattingMessageRepo
        .createQueryBuilder()
        .update(ChattingMessage)
        .set({ deleted_at: now.toDate() })
        .where('chatting_thread_id = :chatting_thread_id', {
          chatting_thread_id: threadId,
        })
        .execute()

      await chattingThreadRepo.update(threadId, {
        deleted_at: now.toDate(),
      })
      await chattingThreadPinedRepo.delete({ chatting_thread_id: threadId })
    })
  }
}

export type SentMessageEvent = {
  user_id: string
  message_content: string
  message_type: string
  chatting_message: ChattingMessage
  store_id: string
  last_message_by: string
}
