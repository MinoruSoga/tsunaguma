import {
  defaultStoreOrdersFields,
  defaultStoreOrdersRelations,
  TransactionBaseService,
} from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import UserService from '../../user/services/user.service'
import { OrderHistory } from '../entity/order-history.entity'
import { OrderHistoryRepository } from '../repository/order-history.repository'
import { OrderService } from './order.service'

type InjectedDependencies = {
  manager: EntityManager
  orderHistoryRepository: typeof OrderHistoryRepository
  orderService: OrderService
  userService: UserService
}

@Service()
export class OrderHistoryService extends TransactionBaseService {
  static resolutionKey = 'orderHistoryService'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected orderHistoryRepository_: typeof OrderHistoryRepository
  protected orderService_: OrderService
  protected userService: UserService

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.orderHistoryRepository_ = container.orderHistoryRepository
    this.orderService_ = container.orderService
    this.userService = container.userService
  }
  async listHistory(orderId: string, config: FindConfig<OrderHistory>) {
    const orderHistoryRepo = this.manager_.getCustomRepository(
      this.orderHistoryRepository_,
    )
    const query = buildQuery(
      { order_id: orderId },
      { ...config, relations: ['creator'] },
    )

    return await orderHistoryRepo.findAndCount(query)
  }

  async create_(orderId: string, userId: string) {
    return await this.atomicPhase_(async (manager) => {
      const orderHistoryRepo = manager.getCustomRepository(
        this.orderHistoryRepository_,
      ) as OrderHistoryRepository

      const order = await this.orderService_.retrieveDetail(orderId, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        select: defaultStoreOrdersFields.concat([
          'cancel_status',
          'parent_id',
          'metadata',
          'cancel_reason',
          'refundable_amount',
          'shipped_at',
          'updated_at',
        ]),
        relations: defaultStoreOrdersRelations.concat([
          'store',
          'store.owner',
          'store.store_detail',
          'items.line_item_addons',
          'items.line_item_addons.lv1',
          'items.line_item_addons.lv2',
          'items.shipping_method',
          'billing_address',
          'discounts.parent_discount',
          'returns',
        ]),
      })

      const usId = order.customer_id
      const user = await this.userService.retrieve(
        usId,
        {
          relations: ['address'],
        },
        false,
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = order

      const history = orderHistoryRepo.create({
        order_id: orderId,
        created_by: userId,
        metadata: { order: rest, user },
      })
      return await orderHistoryRepo.save(history)
    })
  }

  async retrieve_(id: string): Promise<OrderHistory> {
    return await this.atomicPhase_(async (manager) => {
      const orderHistoryRepo = manager.getCustomRepository(
        this.orderHistoryRepository_,
      ) as OrderHistoryRepository

      return await orderHistoryRepo.findOne({ id })
    })
  }
}
