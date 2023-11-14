/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AddressRepository } from '@medusajs/medusa/dist/repositories/address'
import { LineItemRepository } from '@medusajs/medusa/dist/repositories/line-item'
import { PaymentRepository } from '@medusajs/medusa/dist/repositories/payment'
import { ReturnRepository } from '@medusajs/medusa/dist/repositories/return'
import { UserService as MedusaUserService } from '@medusajs/medusa/dist/services'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import {
  ExtendedFindConfig,
  FindConfig,
  Selector,
} from '@medusajs/medusa/dist/types/common'
import { ConfigModule, Logger } from '@medusajs/medusa/dist/types/global'
import { UpdateUserInput } from '@medusajs/medusa/dist/types/user'
import {
  buildQuery,
  setMetadata,
  validateId,
} from '@medusajs/medusa/dist/utils'
import jwt from 'jsonwebtoken'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from 'src/interfaces/email-template'
import { DeepPartial, EntityManager, FindConditions, IsNull } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { convertToDateTime } from '../../../helpers/time'
import { NotificationSettingRepository } from '../../notification/repository/notification-setting.repository'
import { NotificationSettingService } from '../../notification/services/notification-setting.service'
import { OrderRepository } from '../../order/repository/order.repository'
import { UserPointRepository } from '../../point/repository/user-point.repository'
import { PointService } from '../../point/services/point.service'
import ProductRepository from '../../product/repository/product.repository'
import { StoreDetailRepository } from '../../store/repository/store-detail.repository'
import { Address } from '../entity/address.entity'
import { User, UserStatus } from '../entity/user.entity'
import { CustomerRepository } from '../repository/customer.repository'
import UserRepository from '../user.repository'
import { JAPANESE_COUNTRY_ISO2 } from './../../../helpers/constant'

type ConstructorParams = {
  manager: EntityManager
  userRepository: typeof UserRepository
  userPointRepository: typeof UserPointRepository
  notificationSettingService: NotificationSettingService
  eventBusService: EventBusService
  loggedInUser?: User
  configModule: ConfigModule
  logger: Logger
  analyticsConfigService: any
  featureFlagRouter: any
  addressRepository: typeof AddressRepository
  orderRepository: typeof OrderRepository
  paymentRepository: typeof PaymentRepository
  returnRepository: typeof ReturnRepository
  productRepository: typeof ProductRepository
  lineItemRepository: typeof LineItemRepository
  notificationSettingRepository: typeof NotificationSettingRepository
  customerRepository: typeof CustomerRepository
  storeDetailRepository: typeof StoreDetailRepository
  pointService: PointService
}

type LoginCredential = {
  password?: string
  email?: string
}

@Service({ override: MedusaUserService })
export default class UserService
  extends MedusaUserService
  implements IEmailTemplateDataService
{
  static Events = {
    ...MedusaUserService.Events,
    REGISTERED: 'user.registered',
    UPDATED_LOGIN_INFO: 'user.updated_login_info',
    UPDATED_LOGIN_INFO_PASSWORD: 'user.updated_login_info_password',
    PASSWORD_RESET_COMPLETE: 'user.password_reset_complete',
    UPDATE_ADDRESS: 'user.update_address',
  }

  private readonly manager: EntityManager
  private readonly userRepository: typeof UserRepository
  private readonly eventBus: EventBusService
  private readonly userPointRepository: typeof UserPointRepository
  private readonly addressRepo: typeof AddressRepository
  private readonly notificationSettingService: NotificationSettingService
  private readonly orderRepo: typeof OrderRepository
  private readonly paymentRepository: typeof PaymentRepository
  private readonly returnRepository: typeof ReturnRepository
  private readonly productRepository: typeof ProductRepository
  private readonly lineItemRepo: typeof LineItemRepository
  private readonly notiSettingRepo: typeof NotificationSettingRepository
  private readonly customerRepo: typeof CustomerRepository
  private readonly storeDetailRepo: typeof StoreDetailRepository
  private readonly pointService: PointService

  constructor(private readonly container: ConstructorParams) {
    super(container)
    this.manager = container.manager
    this.userRepository = container.userRepository
    this.eventBus = container.eventBusService
    this.container = container
    this.userPointRepository = container.userPointRepository
    this.notificationSettingService = container.notificationSettingService
    this.addressRepo = container.addressRepository
    this.orderRepo = container.orderRepository
    this.paymentRepository = container.paymentRepository
    this.returnRepository = container.returnRepository
    this.productRepository = container.productRepository
    this.lineItemRepo = container.lineItemRepository
    this.notiSettingRepo = container.notificationSettingRepository
    this.customerRepo = container.customerRepository
    this.storeDetailRepo = container.storeDetailRepository
    this.pointService = container.pointService
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): UserService {
    if (!transactionManager) {
      return this
    }

    const cloned = new UserService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async retrieveByEmail(
    email: string,
    config: FindConfig<User> = {},
    throwIfNotExist = true,
  ): Promise<User> {
    const manager = this.manager_
    const userRepo = manager.getCustomRepository(this.userRepository_)

    const query = buildQuery(
      { email: email.toLowerCase(), status: UserStatus.ACTIVE },
      config,
    )
    const user = await userRepo.findOne(query as any)

    if (!user && throwIfNotExist) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `User with email: ${email} was not found`,
      )
    }

    return user as User
  }

  async retrieveByApiToken(
    apiToken: string,
    relations: string[] = [],
  ): Promise<User> {
    const manager = this.manager_
    const userRepo = manager.getCustomRepository(this.userRepository_)

    const user = await userRepo.findOne({
      where: { api_token: apiToken, status: UserStatus.ACTIVE },
      relations,
    })

    if (!user) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `User with api token: ${apiToken} was not found`,
      )
    }

    return user as User
  }

  public async retrieve(
    userId: string,
    config: FindConfig<User> = {},
    isActive = true,
    isDetail = false,
  ): Promise<User> {
    const userRepo = this.manager.getCustomRepository(this.userRepository)
    const validatedId = validateId(userId)
    const activeCondition = isActive ? { status: UserStatus.ACTIVE } : {}
    const query = this.buildQuery_(
      { id: validatedId, ...activeCondition },
      config,
    )
    const user = await userRepo.findOne(query)

    if (isDetail) {
      const point = await this.pointService.getTotalPoint(userId)

      const notificationSettings =
        await this.notificationSettingService.retrieve_(userId)

      if (point) {
        user.point = { total: point }
      }

      user.notificationSettings = notificationSettings
    }

    if (!user) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `User with id: ${userId} was not found`,
      )
    }

    return user as User
  }

  public async retrieve_(
    userId: string,
    config?: FindConfig<User>,
  ): Promise<User> {
    const userRepo = this.manager.getCustomRepository(this.userRepository)
    const validatedId = validateId(userId)
    const query = this.buildQuery_({ id: validatedId }, config)
    const user = await userRepo.findOne(query)

    return user as User
  }

  buildQuery_(selector, config = {}): ExtendedFindConfig<unknown, any> {
    if (
      Object.keys(this.container).includes('loggedInUser') &&
      this.container.loggedInUser.store_id
    ) {
      selector['store_id'] = this.container.loggedInUser.store_id
    }

    return buildQuery(selector, config)
  }

  public async addUserToStore(user_id, store_id) {
    await this.atomicPhase_(async (m) => {
      const userRepo = m.getCustomRepository(this.userRepository)
      const query = this.buildQuery_({ id: user_id })

      const user = await userRepo.findOne(query)
      if (user) {
        user.store_id = store_id
        await userRepo.save(user)
      }
    })
  }

  async isEmailExist(email: string): Promise<boolean> {
    try {
      await this.retrieveByEmail(email, {
        select: ['id', 'email'],
      })
      return true
    } catch (error) {
      return false
    }
  }

  public async update_(
    userId: string,
    data: DeepPartial<User>,
    transactionManager?: EntityManager,
  ) {
    const service = transactionManager
      ? this.withTransaction(transactionManager)
      : this
    const user = await service.manager
      .getCustomRepository(this.userRepository)
      .findOne({ id: userId })
    await service.manager
      .getCustomRepository(this.userRepository)
      .save({ id: userId, ...user, ...data })
  }

  async updateLoginInfo(userId: string, data: LoginCredential) {
    return this.atomicPhase_(async (tx) => {
      if (!data.email && !data.password) return

      const user = await this.retrieve(userId, {
        select: ['id', 'email', 'nickname'],
      })
      if (data.email && data.email !== user.email) {
        await this.withTransaction(tx).update_(userId, { email: data.email })
        await this.eventBus_
          .withTransaction(tx)
          .emit(UserService.Events.UPDATED_LOGIN_INFO, {
            id: data.email,
            email: data.email,
            format: 'user-updated-login-info',
            customer_id: user.id,
            data: {
              oldEmail: user.email,
              nickname: user.nickname,
              newEmail: data.email,
              contactLink: loadConfig().frontendUrl.contact,
            },
          })

        await this.eventBus_
          .withTransaction(tx)
          .emit(UserService.Events.UPDATED, {
            id: userId,
            metadata: { description: 'Update user login credentials: email' },
          })
      }

      if (data.password) {
        await this.withTransaction(tx).setPassword_(userId, data.password)
        await this.eventBus_
          .withTransaction(tx)
          .emit(UserService.Events.UPDATED_LOGIN_INFO_PASSWORD, {
            id: data.email || user.email,
            email: data.email || user.email,
            customer_id: user.id,
            format: 'user-updated-login-info-password',
            data: {
              nickname: user.nickname,
              contactLink: loadConfig().frontendUrl.contact,
            },
          })
        await this.eventBus_
          .withTransaction(tx)
          .emit(UserService.Events.UPDATED, {
            id: userId,
            metadata: {
              description: 'Update user login credentials: password',
            },
          })
      }
    })
  }

  /**
   * Generate a JSON Web token, that will be sent to a user, that wishes to
   * register account.
   * The token will be signed with the jwt-secret as a secret
   * a long side a payload with email and the expiry time for the token, which
   * is always 100 minutes.
   * @param {string} email - the email of the user to register account for
   * @return {string} the generated JSON web token
   */
  async generateRegisterToken(email: string): Promise<string> {
    return await this.atomicPhase_(async (transactionManager) => {
      const expiry = Math.floor(Date.now() / 1000) + 60 * 100
      const payload: RegisterTokenPayload = { email: email, exp: expiry }
      const token = jwt.sign(
        payload,
        this.container.configModule.projectConfig.jwt_secret,
      )

      // Notify subscribers
      const eventData: UserNotificationEventData = {
        id: email,
        email,
        format: 'user-register',
        data: {
          link: loadConfig()
            .frontendUrl.register(token)
            .replace(/(^https:\/\/|^http:\/\/)/, ''),
          expiresAt: convertToDateTime(expiry * 1000),
        },
      }
      await this.eventBus_
        .withTransaction(transactionManager)
        .emit(UserService.Events.REGISTERED, eventData)

      return token
    })
  }

  /**
   * Generate a JSON Web token, that will be sent to a user, that wishes to
   * reset password.
   * The token will be signed with the users current password hash as a secret
   * a long side a payload with email and the expiry time for the token, which
   * is always 60 minutes.
   * @param {string} email - the email of the user to reset password for
   * @return {string} the generated JSON web token
   */
  async genResetPasswordToken(email: string): Promise<string | null> {
    return await this.atomicPhase_(async (transactionManager) => {
      const expiry = Math.floor(Date.now() / 1000) + 60 * 60 // 60 minutes
      const payload = { email, exp: expiry }
      const token = jwt.sign(
        payload,
        this.container.configModule.projectConfig.jwt_secret,
      )
      const user = (await this.retrieveByEmail(email)) as User
      if (!user) return null

      await this.withTransaction(transactionManager).setResetPasswordToken(
        user.id,
        token,
      )

      const eventData: UserNotificationEventData = {
        email,
        id: email,
        format: 'user-reset-password',
        data: {
          nickname: user.nickname,
          link: loadConfig().frontendUrl.requestResetPassword(token),
          expiresAt: convertToDateTime(expiry * 1000),
        },
      }
      // Notify subscribers
      await this.eventBus_
        .withTransaction(transactionManager)
        .emit(UserService.Events.PASSWORD_RESET, eventData)

      return token
    })
  }

  decodeRegisterToken(token: string): RegisterTokenPayload {
    try {
      return jwt.verify(
        token,
        this.container.configModule.projectConfig.jwt_secret,
      ) as RegisterTokenPayload
    } catch (error) {
      this.container.logger.warn(error, token)
      return null
    }
  }

  async genEmailData(
    event: string,
    data: UserNotificationEventData,
  ): Promise<EmailTemplateData> {
    return {
      to: data.email,
      format: data.format,
      data: _.omit(data, ['email', 'format']),
      customer_id: data.customer_id ?? null,
    }
  }

  // @OnMedusaEntityEvent.Before.Insert(User, { async: true })
  // public async addStoreId2NewUser(
  //   params: MedusaEventHandlerParams<User, 'Insert'>,
  // ): Promise<EntityEventType<User, 'Insert'>> {
  //   const { event } = params

  //   if (!event.entity.store_id) {
  //     event.entity.store_id = this.container.loggedInUser?.store_id
  //   }

  //   return event
  // }

  public async listUser(selector: Selector<User>, config: FindConfig<User>) {
    const userRepo = this.manager.getCustomRepository(this.userRepository)
    if (!config.relations) {
      config.relations = []
    }
    const query = buildQuery(selector, config)

    query.relations = [...query.relations, 'address']

    return await userRepo.findAndCount(query)
  }

  public async listUserCms(selector: Selector<User>, config: FindConfig<User>) {
    const userRepo = this.manager.getCustomRepository(this.userRepository)
    const query = buildQuery(selector, { ...config, relations: ['customer'] })

    query.where.store_id = IsNull()

    query.select = ['id', 'email', 'created_at']

    return await userRepo.find(query)
  }

  async setResetPasswordToken(userId: string, token: string | null) {
    // @ts-ignore
    await this.update(userId, { reset_password_token: token })
  }

  async update(
    userId: string,
    update: UpdateUserInput & {
      address: Partial<Address>
      avatar?: string
      nickname?: string
      is_reset_avatar?: boolean
    },
  ): Promise<User> {
    return await this.atomicPhase_(async (manager: EntityManager) => {
      const userRepo = manager.getCustomRepository(this.userRepository_)
      const addressRepo = manager.getCustomRepository(this.addressRepo)
      const customerRepo = manager.getCustomRepository(this.customerRepo)

      const user = await this.retrieve(userId)
      const customer = await customerRepo.findOne({ where: { id: userId } })

      const {
        email,
        password_hash,
        metadata,
        nickname,
        address: addressOrId,
        avatar,
        is_reset_avatar = false,
        ...rest
      } = update

      if (email) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'You are not allowed to update email',
        )
      }

      if (password_hash) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Use dedicated methods, `setPassword`, `generateResetPasswordToken` for password operations',
        )
      }

      if (metadata) {
        user.metadata = setMetadata(user, metadata)
      }

      if (addressOrId) {
        let address: Address
        if (typeof addressOrId === 'string') {
          address = (await addressRepo.findOne({
            where: { id: addressOrId },
          })) as Address
        } else {
          address = addressOrId as Address
        }

        address.country_code = JAPANESE_COUNTRY_ISO2

        let addressId

        if (address.id) {
          user.address = await addressRepo.save(address)
          addressId = address.id
        } else {
          if (user.address_id) {
            const addr = await addressRepo.findOne({
              where: { id: user.address_id },
            })

            await addressRepo.save({ ...addr, ...address })
            addressId = user.address_id
          } else {
            const addr = (await addressRepo.save(
              addressRepo.create(address),
            )) as Address
            user.address = addr
            addressId = addr.id
          }
        }

        // update store detail
        await this.eventBus
          .withTransaction(manager)
          .emit(UserService.Events.UPDATE_ADDRESS, {
            addressId,
            userId: user.id,
          })
      }

      if (is_reset_avatar) {
        customer.avatar = null
        user.avatar = null
      } else if (avatar) {
        customer.avatar = avatar
        user.avatar = avatar
      }

      for (const [key, value] of Object.entries(rest)) {
        user[key] = value
      }

      if (nickname) {
        customer.nickname = nickname
        user.nickname = nickname
      }

      await customerRepo.save(customer)
      const updatedUser = await userRepo.save(user)

      await this.eventBus_
        .withTransaction(manager)
        .emit(UserService.Events.UPDATED, {
          id: updatedUser.id,
          metadata: { description: 'Update user from frontend' },
        })

      return updatedUser
    })
  }

  async retrieveByEmailCms(email: string): Promise<User> {
    const manager = this.manager_
    const userRepo = manager.getCustomRepository(this.userRepository_)

    const query = buildQuery(
      { email: email.toLowerCase(), status: UserStatus.ACTIVE },
      {},
    ) as FindConditions<User>
    const user = (await userRepo.findOne(query)) as User

    return user
  }

  async isActive(userId: string) {
    try {
      await this.retrieve(userId, { select: ['id', 'status'] })
      return true
    } catch (error) {
      return false
    }
  }

  async isReRegister(id: string): Promise<boolean> {
    const userRepo = this.manager.getCustomRepository(this.userRepository)
    const user = await userRepo.findOne({ id }, { select: ['email'] })

    if (!user) return false

    const isExist = await userRepo.findOne(
      { email: user.email, status: UserStatus.INACTIVE },
      { select: ['id'] },
    )

    return !!isExist
  }
}

export type RegisterTokenPayload = {
  email: string
  exp: number
}

export type UserNotificationEventData = {
  id: string
  email: string
  token?: string
  link?: string
  format: string
  [key: string]: any
}
