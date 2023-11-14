import {
  FulfillmentProviderService,
  InventoryService,
  Return,
  ReturnReasonService,
  ReturnService as MedusaReturnService,
  ReturnStatus as MedusaReturnStatus,
  TaxProviderService,
} from '@medusajs/medusa'
import { ReturnItemRepository } from '@medusajs/medusa/dist/repositories/return-item'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { OrdersReturnItem } from '@medusajs/medusa/dist/types/orders'
import { CreateReturnInput } from '@medusajs/medusa/dist/types/return'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import { EmailTemplateData } from 'src/interfaces/email-template'
import { EntityManager } from 'typeorm'

import { LineItemService } from '../../cart/services/line-item.service'
import { TotalsService } from '../../cart/services/totals.service'
import { EventBusService } from '../../event/event-bus.service'
import { OrderService } from '../../order/services/order.service'
import { ShippingOptionService } from '../../shipping/services/shipping-option.service'
import { OriginEnum, ReturnStatus } from '../entities/return.entity'
import { ReturnRepository } from '../repository/return.repository'

type InjectedDependencies = {
  logger: Logger
  manager: EntityManager
  totalsService: TotalsService
  lineItemService: LineItemService
  returnRepository: typeof ReturnRepository
  returnItemRepository: typeof ReturnItemRepository
  shippingOptionService: ShippingOptionService
  returnReasonService: ReturnReasonService
  taxProviderService: TaxProviderService
  fulfillmentProviderService: FulfillmentProviderService
  inventoryService: InventoryService
  orderService: OrderService
  eventBusService: EventBusService
}

@Service({ override: MedusaReturnService })
export class ReturnService extends MedusaReturnService {
  static Events = {
    RECEIVE: 'return.receive',
  }

  private logger_: Logger
  protected manager_: EntityManager
  protected transactionManager_: EntityManager | undefined

  protected readonly eventBusService_: EventBusService
  protected readonly totalsService_: TotalsService
  protected readonly returnRepository_: typeof ReturnRepository
  protected readonly returnItemRepository_: typeof ReturnItemRepository
  protected readonly lineItemService_: LineItemService
  protected readonly taxProviderService_: TaxProviderService
  protected readonly shippingOptionService_: ShippingOptionService
  protected readonly fulfillmentProviderService_: FulfillmentProviderService
  protected readonly returnReasonService_: ReturnReasonService
  protected readonly inventoryService_: InventoryService
  protected readonly orderService_: OrderService
  container: InjectedDependencies

  constructor(container: InjectedDependencies) {
    super(container)
    this.container = container
    this.manager_ = container.manager
    this.totalsService_ = container.totalsService
    this.returnRepository_ = container.returnRepository
    this.returnItemRepository_ = container.returnItemRepository
    this.lineItemService_ = container.lineItemService
    this.taxProviderService_ = container.taxProviderService
    this.shippingOptionService_ = container.shippingOptionService
    this.fulfillmentProviderService_ = container.fulfillmentProviderService
    this.returnReasonService_ = container.returnReasonService
    this.inventoryService_ = container.inventoryService
    this.orderService_ = container.orderService
    this.eventBusService_ = container.eventBusService
    this.logger_ = container.logger
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ReturnService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ReturnService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager
    return cloned
  }

  async pause(id: string) {
    return await this.atomicPhase_(async (tx) => {
      const returnRepo = tx.getCustomRepository(this.returnRepository_)
      const data = await returnRepo.findOne(id)
      data.is_pause = !data.is_pause

      await returnRepo.save(data)
    })
  }

  async updateCms(
    id: string,
    data: {
      status?: MedusaReturnStatus
      reason?: string
      origin?: OriginEnum
      note?: string
    },
  ) {
    return await this.atomicPhase_(async (tx) => {
      const note = data.note
      const returnRepo = tx.getCustomRepository(this.returnRepository_)
      const returnItemRepo = tx.getCustomRepository(this.returnItemRepository_)
      const raw = await returnRepo.findOne(id)
      const toUpdate = { ...raw, ..._.omit(data, ['note']) }

      await returnItemRepo.update({ return_id: id }, { note })

      await returnRepo.save(toUpdate)
    })
  }

  async create(data: CreateReturnInput): Promise<Return | never> {
    const returnRepo = this.manager_.getCustomRepository(this.returnRepository_)
    let result: Return = await super.create(data)
    const raw = await returnRepo.findOne(result.id)
    raw.origin = OriginEnum.REQUESTED
    result = await returnRepo.save(raw)
    return result
  }

  async receive(
    returnId: string,
    receivedItems: OrdersReturnItem[],
    refundAmount?: number,
    allowMismatch = false,
  ): Promise<Return | never> {
    const result = await super.receive(
      returnId,
      receivedItems,
      refundAmount,
      allowMismatch,
    )
    await this.eventBusService_.emit(ReturnService.Events.RECEIVE, {
      id: result.id,
      data: result,
      format: 'return-receive',
    })

    return result
  }

  async deleteCms(returnId: string) {
    return await this.atomicPhase_(async (tx) => {
      const returnRepo = tx.getCustomRepository(this.returnRepository_)

      const data = await returnRepo.findOne(returnId)
      data.status = ReturnStatus.DELETED as MedusaReturnStatus
      await returnRepo.save(data)
    })
  }

  async genEmailData(
    event: string,
    data: ReturnNotificationData,
  ): Promise<EmailTemplateData> {
    try {
      const returnRepo = this.manager_.getCustomRepository(
        this.returnRepository_,
      )
      const rt = await returnRepo.findOne(
        {
          id: data.id,
        },
        {
          relations: [
            'items',
            'items.item',
            'items.item.variant',
            'order',
            'order.store',
            'order.store.customer',
            'items.reason',
          ],
        },
      )

      return {
        to: rt.order.store.customer.email,
        format: data.format,
        data: rt,
      }
    } catch (error) {
      this.logger_.error(error)
    }
  }
}

interface ReturnNotificationData {
  id: string
  format: string
  data?: object
}
