import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { DeliveryRequestHistory } from '../entities/delivery-request-history.entity'
import { DeliveryRequestHistoryRepository } from '../repository/delivery-request-history.repository'
import DeliveryRequestService from './delivery-request.service'

type InjectedDependencies = {
  manager: EntityManager
  deliveryRequestHistoryRepository: typeof DeliveryRequestHistoryRepository
  deliveryRequestService: DeliveryRequestService
}

@Service()
export class DeliveryRequestHistoryService extends TransactionBaseService {
  static resolutionKey = 'deliveryRequestHistoryService'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected readonly deliveryRequestHistoryRepo_: typeof DeliveryRequestHistoryRepository
  protected deliveryRequestService_: DeliveryRequestService

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.deliveryRequestHistoryRepo_ =
      container.deliveryRequestHistoryRepository
    this.deliveryRequestService_ = container.deliveryRequestService
  }

  async listHistory(id: string, config: FindConfig<DeliveryRequestHistory>) {
    const deliveryRequestHistoryRepo_ = this.manager_.getCustomRepository(
      this.deliveryRequestHistoryRepo_,
    )
    const query = buildQuery(
      { delivery_request_id: id },
      { ...config, relations: ['creator'] },
    )

    return await deliveryRequestHistoryRepo_.findAndCount(query)
  }

  async create_(createdBy: string, id: string, is_parent: boolean) {
    return await this.atomicPhase_(async (manager) => {
      const deliveryRequestHistoryRepo_ = manager.getCustomRepository(
        this.deliveryRequestHistoryRepo_,
      )

      let data = {}

      if (is_parent) {
        data = await this.deliveryRequestService_.retrieve(
          { id },
          {
            relations: [
              'children',
              'children.product',
              'children.product.variants',
              'children.product.variants.requests',
              'children.product.variants.options',
              'children.product.product_specs',
              'children.product.product_colors',
              'children.product.tags',
              'children.product.product_material',
            ],
          },
        )
      } else {
        data = await this.deliveryRequestService_.retrieve(
          { id },
          {
            relations: [
              'product',
              'product.variants',
              'product.variants.requests',
              'product.variants.options',
              'product.product_specs',
              'product.product_colors',
              'product.tags',
              'product.product_material',
            ],
          },
        )
      }

      const history = deliveryRequestHistoryRepo_.create({
        delivery_request_id: id,
        created_by: createdBy,
        metadata: _.omit(data, ['id']),
      })
      return await deliveryRequestHistoryRepo_.save(history)
    })
  }

  async getOne(id: string) {
    const deliveryRequestHistoryRepo_ = this.manager_.getCustomRepository(
      this.deliveryRequestHistoryRepo_,
    )
    const history = deliveryRequestHistoryRepo_.findOne({
      where: { id },
      relations: [
        'delivery_request',
        'delivery_request.store',
        'delivery_request.store.customer',
        'delivery_request.store.store_detail',
      ],
    })
    return history
  }
}
