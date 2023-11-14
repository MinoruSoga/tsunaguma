import { TransactionBaseService } from '@medusajs/medusa'
import { AddressRepository } from '@medusajs/medusa/dist/repositories/address'
import { LineItemRepository } from '@medusajs/medusa/dist/repositories/line-item'
import { PaymentRepository } from '@medusajs/medusa/dist/repositories/payment'
import { ReturnRepository } from '@medusajs/medusa/dist/repositories/return'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { ConfigModule, Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import {
  Between,
  EntityManager,
  ILike,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm'

import { LineItem } from '../../cart/entity/line-item.entity'
import { NotificationSettings } from '../../notification/entities/notification-settings.entity'
import { NotificationSettingRepository } from '../../notification/repository/notification-setting.repository'
import { NotificationSettingService } from '../../notification/services/notification-setting.service'
import { Order } from '../../order/entity/order.entity'
import { OrderRepository } from '../../order/repository/order.repository'
import { UserPointRepository } from '../../point/repository/user-point.repository'
import { PointService } from '../../point/services/point.service'
import { Product } from '../../product/entity/product.entity'
import ProductRepository from '../../product/repository/product.repository'
import { StoreDetailRepository } from '../../store/repository/store-detail.repository'
import { GetListUserBody } from '../controllers/get-user-list.cms.admin.controller'
import { User, UserType } from '../entity/user.entity'
import { CustomerRepository } from '../repository/customer.repository'
import UserRepository from '../user.repository'

type InjectedDependencies = {
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

@Service()
export class UserSearchService extends TransactionBaseService {
  static resolutionKey = 'userSearchService'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
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

  protected container: InjectedDependencies

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
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

  public async seachCustomer(data: GetListUserBody) {
    const userRepo = this.manager_.getCustomRepository(this.userRepository)

    const selector: Selector<User> = {}
    const config: FindConfig<User> = {
      relations: ['address', 'store', 'customer', 'customer.store_detail'],
      order: { created_at: 'DESC' },
    }

    data.limit !== undefined ? (config.take = data.limit) : ''
    data.offset !== undefined ? (config.skip = data.offset) : ''

    const query = buildQuery(selector, config)

    data.display_id
      ? (query.where.customer = { display_id: data.display_id })
      : ''

    if (data.type && data.type?.length > 0) {
      const types = data.type?.reduce((prev, current) => {
        if (current === 'admin') {
          return [...prev, UserType.ADMIN_ADMIN, UserType.ADMIN_STAFF]
        }
        if (current === 'store') {
          return [...prev, UserType.STORE_PRIME, UserType.STORE_STANDARD]
        }
        return [...prev, current]
      }, [])

      query.where.type = In(types)
    }

    data.nickname ? (query.where.nickname = ILike(`%${data.nickname}%`)) : ''

    data.email ? (query.where.email = ILike(`%${data.email}%`)) : ''

    data.phone
      ? (query.where.address = { phone: ILike(`%${data.phone}%`) })
      : ''

    const checkCreated = await this.checkFromTo(
      data.created_from,
      data.created_to,
    )

    checkCreated === 'dual'
      ? (query.where.created_at = Between(data.created_from, data.created_to))
      : ''

    checkCreated === 'from'
      ? (query.where.created_at = MoreThanOrEqual(data.created_from))
      : ''

    checkCreated === 'to'
      ? (query.where.created_at = LessThanOrEqual(data.created_to))
      : ''

    data.gb_flag?.length ? (query.where.gb_flg = In(data.gb_flag)) : ''

    if (
      data.product_id ||
      data.product_code ||
      data.type_id ||
      data.type_lv1_id ||
      data.type_lv2_id ||
      data.points_from !== undefined ||
      data.points_to !== undefined ||
      data.total_amount_from !== undefined ||
      data.total_amount_to !== undefined ||
      data.return_record_from !== undefined ||
      data.return_record_to !== undefined ||
      !_.isNil(data.fullname) ||
      !_.isNil(data.fullname_furigana) ||
      !_.isNil(data.birthday_month) ||
      !_.isNil(data.birthday_from) ||
      !_.isNil(data.birthday_to) ||
      data.email_notification?.length > 0 ||
      data.gender?.length > 0 ||
      data.use_time_from !== undefined ||
      data.use_time_to !== undefined
    ) {
      let count = 0

      let ids1 = []
      if (data.product_id) {
        ids1 = await this.getUserWithProductId(data.product_id)
        count++
      }

      let ids2 = []
      if (data.product_code) {
        ids2 = await this.getUserWithProductCode(data.product_code)
        count++
      }

      let ids3 = []
      if (data.type_id || data.type_lv1_id || data.type_lv2_id) {
        ids3 = await this.getUserWithProductCategory(
          data.type_id,
          data.type_lv1_id,
          data.type_lv2_id,
        )
        count++
      }

      let ids4 = []
      if (data.points_from !== undefined || data.points_to !== undefined) {
        ids4 = await this.getUserWithPoint(data.points_from, data.points_to)
        count++
      }

      let ids5 = []
      if (
        data.total_amount_from !== undefined ||
        data.total_amount_to !== undefined
      ) {
        ids5 = await this.getUserWithTotalAmount(
          data.total_amount_from,
          data.total_amount_to,
        )
        count++
      }

      let ids6 = []
      if (
        data.return_record_from !== undefined ||
        data.return_record_to !== undefined
      ) {
        ids6 = await this.getUserWithReturnRecord(
          data.return_record_from,
          data.return_record_to,
        )
        count++
      }

      let ids7 = []
      if (data.email_notification?.length > 0) {
        ids7 = await this.getUserWithEmailReg(data.email_notification)
        count++
      }

      let ids8 = []
      if (
        !_.isNil(data.fullname) ||
        !_.isNil(data.fullname_furigana) ||
        !_.isNil(data.birthday_month) ||
        !_.isNil(data.birthday_from) ||
        !_.isNil(data.birthday_to) ||
        data.gender?.length > 0
      ) {
        ids8 = await this.getUser(
          data.fullname,
          data.fullname_furigana,
          data.birthday_month,
          data.birthday_from,
          data.birthday_to,
          data.gender,
        )
        count++
      }

      let ids9 = []
      if (data.use_time_from !== undefined || data.use_time_to !== undefined) {
        ids9 = await this.getTotalTimeOfUser(
          Number(data.use_time_from),
          data.use_time_to,
        )
        count++
      }

      const ids = [].concat(
        ids1,
        ids2,
        ids3,
        ids4,
        ids5,
        ids6,
        ids7,
        ids8,
        ids9,
      )
      const idss = _.countBy(ids)

      const listIds = []
      for (const key in idss) {
        if (idss[key] === count) {
          listIds.push(key)
        }
      }

      query.where.id = In(listIds)
    }

    return await userRepo.findAndCount(query)
  }

  async getUserWithProductCode(data: string) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepo)

    const productRepo = this.manager_.getCustomRepository(
      this.productRepository,
    )

    const selector: Selector<Product> = {}
    const config: FindConfig<Product> = {
      relations: ['variants'],
      select: ['id'],
    }

    const query = buildQuery(selector, config)

    query.where.display_code = ILike(`%${data}%`)

    const product = await productRepo.findOne(query)

    if (!product) {
      return
    }

    const variantIds = []
    for (const i of product.variants) {
      variantIds.push(i.id)
    }

    const lineItemRepo = this.manager_.getCustomRepository(this.lineItemRepo)

    const selector_: Selector<LineItem> = {}
    const config_: FindConfig<LineItem> = {
      select: ['order_id'],
    }

    const query_ = buildQuery(selector_, config_)
    query_.where.variant_id = In(variantIds)
    query_.where.order_id = Not(IsNull())

    const lineItem = await lineItemRepo.find(query_)

    if (!lineItem) {
      return []
    }

    const orderIds = []

    for (const item of lineItem) {
      const find = orderIds.find((e) => e === item.order_id)
      if (!find) {
        orderIds.push(item.order_id)
      }
    }

    if (orderIds.length < 1) {
      return []
    }

    const selector1: Selector<Order> = {}
    const config1: FindConfig<Order> = {
      select: ['customer_id'],
    }

    const qb = buildQuery(selector1, config1)

    qb.where.id = In(orderIds)
    qb.where.parent_id = Not(IsNull())

    const result = await oderRepo.find(qb)

    if (!result) {
      return
    }

    const rs = []
    for (const ite of result) {
      const find = rs.find((e) => e === ite.customer_id)
      if (!find) {
        rs.push(ite.customer_id)
      }
    }

    return rs
  }

  async getUserWithProductId(data: number) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepo)

    const productRepo = this.manager_.getCustomRepository(
      this.productRepository,
    )

    const selector: Selector<Product> = {}
    const config: FindConfig<Product> = {
      relations: ['variants'],
      select: ['id'],
    }

    const query = buildQuery(selector, config)

    query.where.display_id = data

    const product = await productRepo.findOne(query)

    if (!product) {
      return
    }

    const variantIds = []
    for (const i of product.variants) {
      variantIds.push(i.id)
    }

    const lineItemRepo = this.manager_.getCustomRepository(this.lineItemRepo)

    const selector_: Selector<LineItem> = {}
    const config_: FindConfig<LineItem> = {
      select: ['order_id'],
    }

    const query_ = buildQuery(selector_, config_)
    query_.where.variant_id = In(variantIds)
    query_.where.order_id = Not(IsNull())

    const lineItem = await lineItemRepo.find(query_)

    if (!lineItem) {
      return []
    }

    const orderIds = []

    for (const item of lineItem) {
      const find = orderIds.find((e) => e === item.order_id)
      if (!find) {
        orderIds.push(item.order_id)
      }
    }

    if (orderIds.length < 1) {
      return []
    }

    const selector1: Selector<Order> = {}
    const config1: FindConfig<Order> = {
      select: ['customer_id'],
    }

    const qb = buildQuery(selector1, config1)

    qb.where.id = In(orderIds)
    qb.where.parent_id = Not(IsNull())

    const result = await oderRepo.find(qb)

    if (!result) {
      return
    }

    const rs = []
    for (const ite of result) {
      const find = rs.find((e) => e === ite.customer_id)
      if (!find) {
        rs.push(ite.customer_id)
      }
    }

    return rs
  }

  async getUserWithProductCategory(
    type_id: string,
    type_lv1_id: string,
    type_lv2_id: string,
  ) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepo)

    const productRepo = this.manager_.getCustomRepository(
      this.productRepository,
    )

    const selector: Selector<Product> = {}
    const config: FindConfig<Product> = {
      relations: ['variants'],
      select: ['id'],
    }

    const query = buildQuery(selector, config)

    type_id ? (query.where.type_id = type_id) : ''

    type_lv1_id ? (query.where.type_lv1_id = type_lv1_id) : ''

    type_lv2_id ? (query.where.type_lv2_id = type_lv2_id) : ''

    const product = await productRepo.find(query)

    if (!product) {
      return
    }

    const variantIds = []
    for (const i of product) {
      for (const j of i.variants) {
        variantIds.push(j.id)
      }
    }

    const lineItemRepo = this.manager_.getCustomRepository(this.lineItemRepo)

    const selector_: Selector<LineItem> = {}
    const config_: FindConfig<LineItem> = {
      select: ['order_id'],
    }

    const query_ = buildQuery(selector_, config_)
    query_.where.variant_id = In(variantIds)
    query_.where.order_id = Not(IsNull())

    const lineItem = await lineItemRepo.find(query_)

    if (!lineItem) {
      return []
    }

    const orderIds = []

    for (const item of lineItem) {
      const find = orderIds.find((e) => e === item.order_id)
      if (!find) {
        orderIds.push(item.order_id)
      }
    }

    if (orderIds.length < 1) {
      return []
    }

    const selector1: Selector<Order> = {}
    const config1: FindConfig<Order> = {
      select: ['customer_id'],
    }

    const qb = buildQuery(selector1, config1)

    qb.where.id = In(orderIds)

    const result = await oderRepo.find(qb)

    if (!result) {
      return
    }

    const rs = []
    for (const ite of result) {
      const find = rs.find((e) => e === ite.customer_id)
      if (!find) {
        rs.push(ite.customer_id)
      }
    }

    return rs
  }

  async getUserWithEmailReg(data: string[]) {
    const status = []
    for (const item of data) {
      if (item === 'registered') {
        status.push(true)
      } else if (item === 'unregistered') {
        status.push(false)
      }
    }

    const notiSettingRepo = this.manager_.getCustomRepository(
      this.notiSettingRepo,
    )

    const selector: Selector<NotificationSettings> = {
      is_newletter: In(status),
    }
    const config: FindConfig<NotificationSettings> = { select: ['user_id'] }

    const query = buildQuery(selector, config)

    const list = await notiSettingRepo.find(query)

    const rs = []
    for (const e of list) {
      const f = rs.find((i) => i === e.user_id)
      if (!f) {
        rs.push(e.user_id)
      }
    }
    return rs
  }

  async getUserWithPoint(from: number, to: number) {
    const userRepo = this.manager_.getCustomRepository(this.userRepository)

    const selector: Selector<User> = {}
    const config: FindConfig<User> = { select: ['id'] }

    const query = buildQuery(selector, config)

    const checkRangePoint = await this.checkRange(from, to)

    const result = await userRepo.find(query)

    const rs = await Promise.all(
      result.map(async (e) => {
        const point = await this.pointService.getTotalPoint(e.id)

        if (checkRangePoint === 'dual')
          if (point >= from && point <= to) {
            return e.id
          }
        if (checkRangePoint === 'from') if (point >= from) return e.id

        if (checkRangePoint === 'to') if (point <= to) return e.id
      }),
    )

    return rs.filter((x) => {
      return x !== undefined
    })
  }

  async getUserWithTotalAmount(from: number, to: number) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepo)

    const paymentRepo = this.manager_.getCustomRepository(
      this.paymentRepository,
    )

    const checkAmount = await this.checkRange(from, to)

    const query = paymentRepo
      .createQueryBuilder('payment')
      .select(['sum(payment.amount) as total_amount', 'order_id'])
      .where('captured_at is not null AND order_id is not null')
      .groupBy('order_id')

    checkAmount === 'dual'
      ? query.having('sum(payment.amount) BETWEEN :from AND :to', { from, to })
      : ''

    checkAmount === 'from'
      ? query.having('sum(payment.amount) >= :from', { from })
      : ''

    checkAmount === 'to'
      ? query.having('sum(payment.amount) <= :to', { to })
      : ''

    const result = await query.getRawMany()

    const orderIds = result.map((e) => e.order_id)

    const selector: Selector<Order> = {}
    const config: FindConfig<Order> = { select: ['customer_id'] }

    const query_ = buildQuery(selector, config)

    query_.where.parent_id = Not(IsNull())
    query_.where.id = In(orderIds)

    const orders = await oderRepo.find(query_)

    const rs = []
    for (const i of orders) {
      const find = rs.find((e) => e === i.customer_id)
      if (!find) {
        rs.push(i.customer_id)
      }
    }

    return rs
  }

  async getUserWithReturnRecord(from: number, to: number) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepo)

    const returnRepo = this.manager_.getCustomRepository(this.returnRepository)

    const checkAmount = await this.checkRange(from, to)

    const query = returnRepo
      .createQueryBuilder('return')
      .select(['count(*) as count', 'order_id'])
      .where('status = :status', { status: 'received' })
      .groupBy('order_id')

    checkAmount === 'dual'
      ? query.having('count(*) BETWEEN :from AND :to', { from, to })
      : ''

    checkAmount === 'from' ? query.having('count(*) >= :from', { from }) : ''

    checkAmount === 'to' ? query.having('count(*) <= :to', { to }) : ''

    const result = await query.getRawMany()

    if (!result) {
      return
    }

    const orderIds = result.map((e) => e.order_id)

    const selector: Selector<Order> = {}
    const config: FindConfig<Order> = { select: ['customer_id'] }

    const query_ = buildQuery(selector, config)

    query_.where.parent_id = Not(IsNull())
    query_.where.id = In(orderIds)

    const orders = await oderRepo.find(query_)

    const rs = []
    for (const i of orders) {
      const find = rs.find((e) => e === i.customer_id)
      if (!find) {
        rs.push(i.customer_id)
      }
    }

    return rs
  }

  async getTotalTimeOfUser(from: number, to: number) {
    const oderRepo = this.manager_.getCustomRepository(this.orderRepo)

    const check = await this.checkRange(from, to)

    const query = oderRepo
      .createQueryBuilder('user')
      .select('customer_id')
      .where('parent_id IS NOT NUll')
      .groupBy('customer_id')

    if (check === 'dual') {
      query.having(`count(*) BETWEEN ${from} AND ${to}`)
    }

    if (check === 'from') {
      query.having(`count(*) >= ${from}`)
    }

    if (check === 'to') {
      query.having(`count(*) <= ${to}`, {
        to: to,
      })
    }

    const users = await query.getRawMany()

    return users.map((user) => user.customer_id)
  }

  async checkFromTo(from: string, to: string) {
    if (from && to) {
      return 'dual'
    } else if (from) {
      return 'from'
    } else if (to) {
      return 'to'
    }
    return 'none'
  }

  async checkRange(from: number, to: number) {
    if (from !== undefined && to !== undefined) {
      return 'dual'
    } else if (from !== undefined) {
      return 'from'
    } else if (to !== undefined) {
      return 'to'
    }
    return 'none'
  }

  async getUser(
    fullname?: string,
    furigana?: string,
    birthdayMonth?: number,
    birthdayFrom?: string,
    birthdayTo?: string,
    gender?: string[],
  ) {
    const storeRepo = this.manager_.getCustomRepository(this.storeDetailRepo)

    const qb = storeRepo.createQueryBuilder('store_detail')

    qb.where('1 = 1')

    if (gender?.length > 0) {
      qb.andWhere('gender IN (:...gender)', { gender: gender })
    }

    if (fullname) {
      qb.andWhere(
        "((upper(CONCAT(store_detail.firstname, ' ', store_detail.lastname)) LIKE :fullName) OR (upper(CONCAT(store_detail.firstname, store_detail.lastname)) LIKE :fullName))",
        { fullName: `%${fullname.toUpperCase()}%` },
      )
    }

    if (furigana) {
      qb.andWhere(
        "((upper(CONCAT(store_detail.firstname_kana, ' ', store_detail.lastname_kana)) LIKE :fullNameKana) OR (upper(CONCAT(store_detail.firstname_kana, store_detail.lastname_kana)) LIKE :fullNameKana))",
        { fullNameKana: `%${furigana.toUpperCase()}%` },
      )
    }

    if (birthdayMonth) {
      qb.andWhere("to_char(store_detail.birthday, 'MM') = :month", {
        month: birthdayMonth < 10 ? `0${birthdayMonth}` : `${birthdayMonth}`,
      })
    }

    if (birthdayFrom && birthdayTo) {
      qb.andWhere(
        "to_char(store_detail.birthday, 'YYYY-MM-DD') BETWEEN :from AND :to",
        {
          from: dayjs(birthdayFrom).format('YYYY-MM-DD'),
          to: dayjs(birthdayTo).format('YYYY-MM-DD'),
        },
      )
    } else if (birthdayFrom) {
      qb.andWhere("to_char(store_detail.birthday, 'YYYY-MM-DD') >= :from", {
        from: dayjs(birthdayFrom).format('YYYY-MM-DD'),
      })
    } else if (birthdayTo) {
      qb.andWhere("to_char(store_detail.birthday, 'YYYY-MM-DD') <= :to", {
        to: dayjs(birthdayTo).format('YYYY-MM-DD'),
      })
    }

    const result = await qb.getMany()
    return [...new Set(result.map((r) => r.user_id).filter((v) => !!v))]
  }
}
