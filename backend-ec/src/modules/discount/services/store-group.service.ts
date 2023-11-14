import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import {
  buildQuery,
  formatException,
  PostgresError,
} from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { DeepPartial, EntityManager, In, IsNull, Not } from 'typeorm'

import { OrderRepository } from '../../order/repository/order.repository'
import StoreRepository from '../../store/repository/store.repository'
import StoreService from '../../store/services/store.service'
import { DiscountType } from '../entities/discount.entity'
import { StoreGroup } from '../entities/store-group.entity'
import { StoreGroupStores } from '../entities/store-group-stores.entity'
import { DiscountRepository } from '../repository/discount.repository'
import { StoreGroupRepository } from '../repository/store-group.repository'
import { StoreGroupStoresRepository } from '../repository/store-group-stores.repository'

type InjectedDependencies = {
  manager: EntityManager
  storeGroupRepository: typeof StoreGroupRepository
  storeGroupStoresRepository: typeof StoreGroupStoresRepository
  storeRepository: typeof StoreRepository
  storeService: StoreService
  orderRepository: typeof OrderRepository
  discountRepository: typeof DiscountRepository
}

export type PostStoreGroupBody = {
  name: string
  type_id: string
}

@Service()
export class StoreGroupService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'storeGroupService'
  protected readonly storeGroupRepo_: typeof StoreGroupRepository
  protected readonly storeGroupStoresRepo_: typeof StoreGroupStoresRepository
  protected readonly storeRepo_: typeof StoreRepository
  protected readonly storeService: StoreService
  protected readonly orderRepo_: typeof OrderRepository
  protected readonly discountRepo_: typeof DiscountRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.storeGroupRepo_ = container.storeGroupRepository
    this.storeGroupStoresRepo_ = container.storeGroupStoresRepository
    this.storeRepo_ = container.storeRepository
    this.manager_ = container.manager
    this.storeService = container.storeService
    this.orderRepo_ = container.orderRepository
    this.discountRepo_ = container.discountRepository
  }

  async retrieve(id: string, config = {}): Promise<StoreGroup> {
    const sgRepo = this.manager_.getCustomRepository(this.storeGroupRepo_)

    const query = buildQuery({ id }, config)

    const storeGroup = await sgRepo.findOne(query)
    if (!storeGroup) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `StoreGroup with id ${id} was not found`,
      )
    }

    return storeGroup
  }

  async create(group: DeepPartial<StoreGroup>): Promise<StoreGroup> {
    return await this.atomicPhase_(async (manager) => {
      try {
        const sgRepo: StoreGroupRepository = manager.getCustomRepository(
          this.storeGroupRepo_,
        )

        const created = sgRepo.create(group)
        return await sgRepo.save(created)
      } catch (err) {
        if (err.code === PostgresError.DUPLICATE_ERROR) {
          throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, err.detail)
        }
        throw err
      }
    })
  }

  async addStores(
    id: string,
    storeIds: string | string[],
  ): Promise<StoreGroup> {
    let ids: string[]
    if (typeof storeIds === 'string') {
      ids = [storeIds]
    } else {
      ids = storeIds
    }

    return await this.atomicPhase_(
      async (manager) => {
        const sgRepo: StoreGroupRepository = manager.getCustomRepository(
          this.storeGroupRepo_,
        )
        return await sgRepo.addStores(id, ids)
      },
      async (error: any) => {
        if (error.code === PostgresError.FOREIGN_KEY_ERROR) {
          await this.retrieve(id)

          const existingStores = await this.storeService.list(
            {
              id: In(ids),
            },
            { select: ['id'] },
          )

          const nonExistingStores = ids.filter(
            (sId) => existingStores.findIndex((el) => el.id === sId) === -1,
          )

          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `The following store ids do not exist: ${JSON.stringify(
              nonExistingStores.join(', '),
            )}`,
          )
        }
        throw formatException(error)
      },
    )
  }

  async getStoreGroupDetail(
    id: string,
    config: FindConfig<StoreGroupStores>,
    discountId?: string,
  ) {
    return await this.atomicPhase_(async (manager) => {
      const storeGroupStoresRepo: StoreGroupStoresRepository =
        manager.getCustomRepository(this.storeGroupStoresRepo_)

      const discountRepo = manager.getCustomRepository(this.discountRepo_)

      const query = buildQuery(
        { store_group_id: id },
        { ...config, relations: ['store', 'store_group'] },
      )

      const [storeGroups, count] = await storeGroupStoresRepo.findAndCount(
        query,
      )

      const raw = { released_at: null, total_sheet: 0 }

      let discount: any = undefined
      if (discountId) {
        discount = await discountRepo.findOne(discountId)
      }

      if (discountId) {
        const data = await this.getTotalSheetStoreGroup(discountId)
        raw.released_at = data['released_at']
        raw.total_sheet = data['total_sheet']
      }

      await Promise.all(
        storeGroups.map(async (e) => {
          let total_used = 0

          if (discountId) {
            if (discount && discount?.type === DiscountType.PROMO_CODE) {
              if (
                discount?.store_target_group &&
                discount?.owner_store_id === e.store_id
              ) {
                total_used = await this.getTotalUsedStoreGroupPC(discountId)
              }
            } else {
              total_used = await this.getTotalUsedStoreGroup(
                e.store_id,
                discountId,
              )
            }
          }

          let total_amount = 0

          if (discountId) {
            if (discount && discount?.type === DiscountType.PROMO_CODE) {
              if (
                discount?.store_target_group &&
                discount?.owner_store_id === e.store_id
              ) {
                total_amount = await this.getTotalAmountStoreGroupPC(discountId)
              }
            } else {
              total_amount = await this.getTotalAmountStoreGroup(
                e.store_id,
                discountId,
              )
            }
          }

          e.total_used = total_used

          if (
            discount?.type !== DiscountType.PROMO_CODE ||
            (discount?.type === DiscountType.PROMO_CODE &&
              discount?.owner_store_id === e.store_id)
          ) {
            e.total_sheet = raw.total_sheet
          } else {
            e.total_sheet = 0
          }

          e.total_amount = total_amount

          if (
            discount?.type !== DiscountType.PROMO_CODE ||
            (discount?.type === DiscountType.PROMO_CODE &&
              discount?.owner_store_id === e.store_id)
          ) {
            e.released_at = raw.released_at
          } else {
            e.released_at = null
          }

          return e
        }),
      )
      return [storeGroups, count]
    })
  }

  async getTotalUsedStoreGroup(storeId: string, discountId?: string) {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getCustomRepository(this.orderRepo_)

      const count = await orderRepo
        .createQueryBuilder('order')
        .select('COUNT(*)')
        .where(
          'order.parent_id IN (SELECT order_id FROM public.order_discounts od WHERE discount_id = :discountId)',
          { discountId: discountId },
        )
        .andWhere('order.store_id = :storeId', {
          storeId: storeId,
        })
        .getCount()

      return count
    })
  }

  async getTotalUsedStoreGroupPC(discountId: string) {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getCustomRepository(this.orderRepo_)

      const count = await orderRepo
        .createQueryBuilder('order')
        .select('COUNT(*)')
        .where(
          'order.parent_id IN (SELECT order_id FROM public.order_discounts od WHERE discount_id = :discountId)',
          { discountId: discountId },
        )
        .getCount()

      return count
    })
  }

  async getTotalAmountStoreGroupPC(discountId: string) {
    return await this.atomicPhase_(async (manager) => {
      const discountRepo = manager.getCustomRepository(this.discountRepo_)

      const query = buildQuery(
        {
          parent_discount_id: discountId,
        },
        { relations: ['rule'] },
      )

      const discounts = await discountRepo.find(query)

      if (!discounts) {
        return 0
      }

      let totalAmount = 0

      for (const discount of discounts) {
        if (discount.parent_discount_id === discountId) {
          totalAmount += discount.rule.value
        }
      }

      return totalAmount
    })
  }

  async getTotalAmountStoreGroup(storeId: string, discountId?: string) {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getCustomRepository(this.orderRepo_)

      const query = buildQuery(
        {
          parent_id: Not(IsNull()),
          store_id: storeId,
        },
        { relations: ['discounts', 'discounts.rule'] },
      )

      const data = await orderRepo.find(query)

      if (!data) {
        return 0
      }

      let totalAmount = 0

      for (const order of data) {
        for (const discount of order.discounts) {
          if (discount.parent_discount_id === discountId) {
            totalAmount += discount.rule.value
          }
        }
      }

      return totalAmount
    })
  }

  async getTotalSheetStoreGroup(discountId: string) {
    return await this.atomicPhase_(async (manager) => {
      const discountRepo = manager.getCustomRepository(this.discountRepo_)

      const data = await discountRepo.findOne(discountId)
      if (!data) {
        return 0
      }
      if (data.usage_limit) {
        return {
          total_sheet: data.usage_limit - data.usage_count,
          released_at: data.released_at,
        }
      }
      return {
        total_sheet: 0,
        released_at: data.released_at,
      }
    })
  }

  async getStores(storeGroupId: string): Promise<string[]> {
    const storeGroupStoresRepo: StoreGroupStoresRepository =
      this.manager_.getCustomRepository(this.storeGroupStoresRepo_)

    const data = await storeGroupStoresRepo.find({
      store_group_id: storeGroupId,
    })
    if (!data?.length) {
      return []
    }

    return data.map((e) => e.store_id)
  }

  async removeGroupStores(storeGroupId: string, storeId: string) {
    return await this.atomicPhase_(async (manager) => {
      const storeGroupStoresRepo: StoreGroupStoresRepository =
        manager.getCustomRepository(this.storeGroupStoresRepo_)

      await storeGroupStoresRepo.delete({
        store_group_id: storeGroupId,
        store_id: Not(storeId),
      })
    })
  }
}
