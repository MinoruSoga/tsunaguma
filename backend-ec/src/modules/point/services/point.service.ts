/* eslint-disable @typescript-eslint/ban-ts-comment */
import { TransactionBaseService } from '@medusajs/medusa'
import { EventBusService } from '@medusajs/medusa/dist/services'
import { Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import dayjs from 'dayjs'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest, Service } from 'medusa-extender'
import { EmailTemplateData } from 'src/interfaces/email-template'
import { Between, EntityManager, MoreThan, Raw } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { PaginationType } from '../../../interfaces/pagination'
import { CacheService } from '../../cache/cache.service'
import UserRepository from '../../user/user.repository'
import { UpdatePointReq } from '../controllers/update-point.cms.admin.controller'
import { UserPoint } from '../entities/user-point.entity'
import { UserPointHistory } from '../entities/user-point-history.entity'
import { UserPointRepository } from '../repository/user-point.repository'
import { UserPointHistoryRepository } from '../repository/user-point-history.repository'
import { NotificationTemplateData } from './../../../interfaces/notification-template'
import { Cart } from './../../cart/entity/cart.entity'
import { NotificationSettingService } from './../../notification/services/notification-setting.service'

interface ConstructorParams {
  manager: EntityManager
  userPointHistoryRepository: typeof UserPointHistoryRepository
  userPointRepository: typeof UserPointRepository
  notificationSettingService: NotificationSettingService
  eventBusService: EventBusService
  userRepository: typeof UserRepository
  cacheService: CacheService
  logger: Logger
}

export type CreatePointInput = {
  user_id: string
  amount: number
  message?: string
  expired_at?: string | Date
  id?: string
}

const defaultExpireTime = 6 * 30 * 24 * 60 * 60 * 1000

@Service()
export class PointService extends TransactionBaseService {
  static resolutionKey = 'pointService'

  static Events = {
    REWARD_POINT: 'point.rewarded',
    EXPIRE_POINT: 'point.expired',
    CUSTOMER_EXPIRE_POINT: 'point.expired.customer',
  }

  protected manager_: EntityManager
  protected transactionManager_: EntityManager

  protected readonly userRepo_: typeof UserRepository
  protected readonly userPointHistoryRepository_: typeof UserPointHistoryRepository
  protected readonly userPointRepository_: typeof UserPointRepository
  protected notificationService: NotificationSettingService
  protected eventBusService: EventBusService
  protected cacheService: CacheService
  private logger_: Logger

  constructor(private readonly container: ConstructorParams) {
    super(container)
    this.manager_ = container.manager
    this.userPointHistoryRepository_ = container.userPointHistoryRepository
    this.userPointRepository_ = container.userPointRepository
    this.notificationService = container.notificationSettingService
    this.eventBusService = container.eventBusService
    this.userRepo_ = container.userRepository
    this.cacheService = container.cacheService
    this.logger_ = container.logger
  }

  // @ts-ignore
  withTransaction(transactionManager: EntityManager): PointService {
    if (!transactionManager) {
      return this
    }

    const cloned = new PointService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.manager_ = transactionManager

    return cloned
  }

  async list(
    req: MedusaRequest,
    userId: string,
  ): Promise<PaginationType<UserPointHistory>> {
    const historyRepo = this.manager_.getCustomRepository(
      this.userPointHistoryRepository_,
    )
    const query = req.query
    const take = parseInt(<string>query.take) || 10
    const page = parseInt(<string>query.page) || 1
    const skip = (page - 1) * take
    const [result, total] = await historyRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: take,
      skip: skip,
    })

    return {
      items: [...result],
      count: total,
    }
  }

  async listUser(
    userId: string,
    req: MedusaRequest,
  ): Promise<PaginationType<UserPointHistory>> {
    const historyRepo = this.manager_.getCustomRepository(
      this.userPointHistoryRepository_,
    )
    const query = req.query
    const take = parseInt(<string>query.take) || 10
    const page = parseInt(<string>query.page) || 1
    const skip = (page - 1) * take
    const [result, total] = await historyRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: take,
      skip: skip,
    })

    return {
      items: [...result],
      count: total,
    }
  }

  public async getPointExpired(userId: string): Promise<UserPointHistory> {
    const historyRepo = this.manager_.getCustomRepository(
      this.userPointHistoryRepository_,
    )

    return await historyRepo.findOne({
      where: {
        amount: Raw((alias) => `${alias} > 0`),
        left_amount: Raw((alias) => `${alias} > 0`),
        user_id: userId,
        expired_at: Raw((alias) => `${alias} > NOW()`),
      },
      order: {
        expired_at: 'ASC',
      },
    })
  }

  public async getListActivePoints(userId: string) {
    const userPointHistoryRepo = this.manager_.getCustomRepository(
      this.userPointHistoryRepository_,
    )
    const date = new Date()

    const qb = userPointHistoryRepo.createQueryBuilder('usp')

    qb.where({ user_id: userId })
    qb.andWhere('(usp.left_amount > 0)')
    qb.andWhere('(usp.amount > 0)')
    qb.andWhere('(usp.expired_at is null OR usp.expired_at > :date)', {
      date: date.toUTCString(),
    })
    qb.orderBy('usp.expired_at', 'ASC')
    const phs = await qb.getMany()

    return phs
  }

  public async getTotalPoint(userId: string): Promise<number> {
    const config = loadConfig()

    const point = await this.cacheService.get(config.cache.totalPoint(userId))

    if (point !== null && point !== undefined) return Number(point)

    const phs = await this.getListActivePoints(userId)

    const totalPoint = phs.reduce(
      (acc, current) => acc + current.left_amount,
      0,
    )

    // save to redis
    await this.cacheService.set(
      config.cache.totalPoint(userId),
      totalPoint,
      12 * 60 * 60,
    )

    return totalPoint
  }

  async validCustomerPointOrThrow(cart: Cart, point: number): Promise<void> {
    if (point === 0) return

    const customerPoint = await this.getTotalPoint(cart.customer_id)

    if (customerPoint < point || cart.subtotal + cart.shipping_total < point)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Point amount is invalid',
      )
  }

  async create(data: CreatePointInput) {
    return this.atomicPhase_(async (transactionManager) => {
      const { message, amount, user_id, expired_at } = data
      const config = loadConfig()

      // do not create point with amount = 0
      if (amount === 0) return

      const userPointHistoryRepo = transactionManager.getCustomRepository(
        this.userPointHistoryRepository_,
      )

      const totalPoint = await this.withTransaction(
        transactionManager,
      ).getTotalPoint(user_id)

      if (amount + totalPoint < 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Total point left is not enough',
        )
      }

      // create a point history record
      const toSave = userPointHistoryRepo.create({
        amount,
        expired_at,
        user_id,
        metadata: { message },
      })

      if (amount > 0) {
        toSave.left_amount = amount
        toSave.expired_at = expired_at
          ? new Date(expired_at)
          : new Date(Date.now() + defaultExpireTime)
      }

      if (data.id) toSave.id = data.id

      const res = await userPointHistoryRepo.save(toSave)
      await this.cacheService.invalidate(config.cache.totalPoint(user_id))

      if (amount > 0) {
        return res
      }

      // re-allocate left point only when user use point (not being given point)
      const phs = await this.withTransaction(
        transactionManager,
      ).getListActivePoints(user_id)

      let amountToCalc = Math.abs(amount)
      for (const ph of phs) {
        if (amountToCalc === 0) break

        const used = Math.min(amountToCalc, ph.left_amount)
        amountToCalc -= used
        ph.left_amount -= used
        await userPointHistoryRepo.save(ph)
      }

      return res
    })
  }

  async createNewCustomerPoint(
    customerId: string,
    initialPoint = 0,
  ): Promise<UserPoint> {
    const userPointRepo = this.manager_.getCustomRepository(
      this.userPointRepository_,
    )

    return await userPointRepo.save(
      userPointRepo.create({
        total: initialPoint,
        user_id: customerId,
      }),
    )
  }

  async initPoint(): Promise<void> {
    this.atomicPhase_(async (transactionManager) => {
      const userPointRepo = transactionManager.getCustomRepository(
        this.userPointRepository_,
      )
      const userPointHistoryRepo = transactionManager.getCustomRepository(
        this.userPointHistoryRepository_,
      )
      const userRepo = transactionManager.getCustomRepository(this.userRepo_)

      // remove point history with amount = 0
      await userPointHistoryRepo.delete({ amount: 0 })

      // reset expire date of point history to null
      await userPointHistoryRepo.update({}, { expired_at: null })

      // and recalc the total of user point = sum (amount)
      const userPoints = await userPointRepo.find()
      for (const userPoint of userPoints) {
        const phs = await userPointHistoryRepo.find({
          user_id: userPoint.user_id,
        })
        const total = phs.reduce((acc, current) => acc + current.amount, 0)
        userPoint.total = total
        await userPointRepo.save(userPoint)
      }

      // set default left_amount
      // ph.amount > 0 => left_amount = amount
      // ph.amount < 0 => left_amount = 0
      const userPointHistories = await userPointHistoryRepo.find()
      for (const ph of userPointHistories) {
        ph.left_amount = ph.amount > 0 ? ph.amount : 0
        await userPointHistoryRepo.save(ph)
      }

      // distribute amount to left_amount
      const users = await userRepo.find()

      for (const user of users) {
        // get all point history of this user ordered by created at descending
        const phs = await userPointHistoryRepo.find({
          order: { created_at: 'ASC' },
          where: { user_id: user.id },
        })

        phs.forEach((ph, index) => {
          if (ph.amount > 0) return

          // use point cases
          let totalUsed = Math.abs(ph.amount)
          for (let i = 0; i < index; i++) {
            // if left amount = 0 => don't do anything, just continue
            if (
              phs[i].left_amount === 0 ||
              totalUsed === 0 ||
              phs[i].amount < 0
            )
              continue

            const used = Math.min(totalUsed, phs[i].left_amount)
            totalUsed -= used
            phs[i].left_amount -= used
          }
        })

        // update user point history to db
        for (const ph of phs) {
          await userPointHistoryRepo.save(ph)
        }
      }

      // alter all, set expired date to each point history
      const phs = await userPointHistoryRepo.find({
        where: {
          amount: Raw((alias) => `${alias} > 0`),
        },
      })

      for (const ph of phs) {
        ph.expired_at = new Date(
          new Date(ph.created_at).getTime() + defaultExpireTime,
        )
        await userPointHistoryRepo.save(ph)
      }
    })
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

  async updatePointCms(data: UpdatePointReq) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.atomicPhase_(async (tm) => {
      const raw = await this.getListActivePoints(data.user_id)

      const totalPoint = raw.reduce(
        (acc, current) => acc + current.left_amount,
        0,
      )
      const tmp: CreatePointInput = {
        user_id: data.user_id,
        amount: data.point - totalPoint,
      }

      await this.create(tmp)
    })
  }

  async sendNotification(userId: string, eventName: string, data: any) {
    const isSettingNoti = await this.notificationService.checkSetting(
      userId,
      'is_points',
    )
    if (!isSettingNoti) return

    await this.eventBusService.emit(eventName, data)
  }

  public async getListPointExpiredNextWeek(
    userId?: string,
  ): Promise<UserPointHistory[]> {
    const historyRepo = this.manager_.getCustomRepository(
      this.userPointHistoryRepository_,
    )

    const query = buildQuery(
      {
        amount: MoreThan(0),
        left_amount: MoreThan(0),
        expired_at: Between(
          dayjs().add(7, 'days').startOf('day'),
          dayjs().add(7, 'days').endOf('day'),
        ),
      } as Selector<UserPointHistory>,
      { order: { expired_at: 'ASC' }, relations: ['user'] },
    )

    if (userId) {
      query.where.user_id = userId
    }

    return await historyRepo.find(query)
  }

  public async sendMailPointExpired(userId: string) {
    await this.eventBusService.emit(PointService.Events.CUSTOMER_EXPIRE_POINT, {
      id: userId,
      format: 'point-expire-customer',
    })
  }

  async genEmailData(
    event: string,
    data: PointNotificationData,
  ): Promise<EmailTemplateData> {
    try {
      const userId = data.id

      const raw = await this.getListPointExpiredNextWeek(userId)
      const total = await this.getTotalPoint(userId)

      return {
        to: raw[0].user.email,
        format: data.format,
        data: { pointHistories: raw, total },
      }
    } catch (error) {
      this.logger_.error(error)
    }
  }
}

interface PointNotificationData {
  id: string
  format: string
}
