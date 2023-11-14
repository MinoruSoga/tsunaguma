import {
  AbstractBatchJobStrategy,
  BatchJobService,
  OrderStatus,
} from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import {
  EntityManager,
  FindConditions,
  In,
  IsNull,
  LessThan,
  MoreThanOrEqual,
  Not,
} from 'typeorm'

import loadConfig from '../helpers/config'
import {
  Discount,
  DiscountType,
} from '../modules/discount/entities/discount.entity'
import { NotificationType } from '../modules/notification/entities/notification.entity'
import { Order, OrderCancelStatus } from '../modules/order/entity/order.entity'
import { OrderRepository } from '../modules/order/repository/order.repository'
import { PointService } from '../modules/point/services/point.service'
import { Customer } from '../modules/user/entity/customer.entity'

interface InjectedDependencies {
  orderRepository: typeof OrderRepository
  manager: EntityManager
  logger: Logger
  batchJobService: BatchJobService
  pointService: PointService
}

interface BatchJobContext {
  from_date?: Date | string | number
  to_date?: Date | string | number
  ids?: string[]
}

interface BatchJobInfoItem {
  order_display_id: number
  order_id: string
  customer_id: string
  store_id: string
  refunded_point: number | null
  customer_avatar: string
}

interface BatchJobInfo {
  count: number
  items: BatchJobInfoItem[]
  advancement_count: number
  [key: string]: unknown
}

const config = loadConfig()

class RefundPointStrategy extends AbstractBatchJobStrategy {
  static identifier = 'refund-point-strategy'
  static batchType = 'refund-point'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected orderRepo_: typeof OrderRepository
  protected pointService: PointService

  private logger_: Logger

  constructor(container: InjectedDependencies) {
    super(container)
    this.orderRepo_ = container.orderRepository
    this.manager_ = container.manager
    this.logger_ = container.logger
    this.batchJobService_ = container.batchJobService
    this.pointService = container.pointService
  }

  // Calculate how many cancelled orders we're gonna refund points
  async preProcessBatchJob(batchJobId: string): Promise<void> {
    return this.atomicPhase_(async (tx) => {
      try {
        const batchJob = await this.batchJobService_
          .withTransaction(tx)
          .retrieve(batchJobId)

        const context = batchJob.context as BatchJobContext
        const orderRepo = this.manager_.getCustomRepository(this.orderRepo_)
        const findOptions: FindConditions<Order> = {
          status: OrderStatus.CANCELED,
          cancel_status: OrderCancelStatus.CANCEL,
          parent_id: Not(IsNull()),
        }

        if (context.from_date) {
          findOptions.canceled_at = MoreThanOrEqual(new Date(context.from_date))
        }

        if (context.to_date) {
          findOptions.canceled_at = LessThan(new Date(context.to_date))
        }

        if (context.ids?.length) {
          findOptions.id = In(context.ids)
        }

        const data = await orderRepo.find({
          where: findOptions,
          select: ['id', 'customer_id', 'display_id', 'store_id'],
          relations: ['discounts', 'customer', 'discounts.rule'],
        })

        const result: BatchJobInfo = {
          count: data.length,
          advancement_count: 0,
          items: data.map((order) => ({
            customer_id: order.customer_id,
            order_id: order.id,
            refunded_point:
              order.discounts?.find(
                (discount: Discount) => discount.type === DiscountType.POINT,
              )?.rule?.value ?? null,
            store_id: order.store_id,
            order_display_id: order.display_id,
            customer_avatar: (order.customer as Customer)?.avatar,
          })),
        }

        await this.batchJobService_
          .withTransaction(tx)
          .update(batchJob, { result })
      } catch (error) {
        this.logger_.error(error)
      }
    })
  }

  async processJob(batchJobId: string): Promise<void> {
    return this.atomicPhase_(async (tx) => {
      try {
        const batchJob = await this.batchJobService_
          .withTransaction(tx)
          .retrieve(batchJobId)

        const batchJobResult = batchJob.result as BatchJobInfo

        if (!batchJobResult?.items?.length) return

        let successCnt = 0
        let errorCtn = 0
        const errors = []
        for (const item of batchJobResult.items) {
          try {
            if (!item.customer_id || !item.refunded_point || !item.store_id)
              continue

            // refund point
            await this.pointService.withTransaction(tx).create({
              amount: item.refunded_point,
              user_id: item.customer_id,
              message: `注文キャンセル　ポイント返還 注文ID： ${item.order_display_id}T`,
              id: `${item.order_id}-${item.customer_id}-order_cancel_complete`,
            })

            // send notification to the user
            await this.pointService
              .withTransaction(tx)
              .sendNotification(
                item.customer_id,
                PointService.Events.REWARD_POINT,
                {
                  id: item.customer_id,
                  customer_id: item.customer_id,
                  type: NotificationType.NOTIFICATION,
                  amount: item.refunded_point,
                  message: `${item.refunded_point}ポイントをお贈りしました`,
                  link: config.frontendUrl.pointList,
                  avatar: item.customer_avatar,
                },
              )

            successCnt++
          } catch (error) {
            errorCtn++
            errors.push(error.message || error)
          }
        }

        batchJobResult.advancement_count = successCnt
        batchJobResult.error_count = errorCtn
        batchJobResult.errors = errors

        await this.batchJobService_.withTransaction(tx).update(batchJob.id, {
          result: batchJobResult,
        })
      } catch (error) {
        this.logger_.error(error)
      }
    })
  }
  buildTemplate(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}

export default RefundPointStrategy
