import { ProductStatus } from '@medusajs/medusa'
import { ShippingMethodRepository } from '@medusajs/medusa/dist/repositories/shipping-method'
import { ShippingOptionRequirementRepository } from '@medusajs/medusa/dist/repositories/shipping-option-requirement'
import {
  EventBusService,
  RegionService,
  ShippingOptionService as MedusaShippingOptionService,
} from '@medusajs/medusa/dist/services'
import { ExtendedFindConfig } from '@medusajs/medusa/dist/types/common'
import { FlagRouter } from '@medusajs/medusa/dist/utils/flag-router'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, In, Not } from 'typeorm'

import StoreRepository from '../../../modules/store/repository/store.repository'
import { PrefectureService } from '../../prefecture/services/prefecture.service'
import { StorePlanType } from '../../store/entity/store.entity'
import { ShippingItemReq } from '../controllers/create-shipping-option.admin.controller'
import {
  ShippingOption,
  ShippingOptionStatusEnum,
} from '../entities/shipping-option.entity'
import { ShippingOptionRepository } from '../repositories/shipping-option.repository'
import { ProductShippingOptionsRepository } from './../../product/repository/product-shipping-options.repository'
import { FulfillmentProviderService } from './fulfillment-provider.service'
import { ShippingProfileService } from './shipping-profile.service'

type InjectedDependencies = {
  manager: EntityManager
  shippingOptionRepository: typeof ShippingOptionRepository
  shippingProfileService: ShippingProfileService
  fulfillmentProviderService: FulfillmentProviderService
  prefectureService: PrefectureService
  regionService: RegionService
  // eslint-disable-next-line max-len
  shippingOptionRequirementRepository: typeof ShippingOptionRequirementRepository
  shippingMethodRepository: typeof ShippingMethodRepository
  featureFlagRouter: FlagRouter
  productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  storeRepository: typeof StoreRepository
  eventBusService: EventBusService
}

type SaveShippingOptionInput = {
  name: string
  profile_id: string
  is_docs?: boolean
  provider: {
    id: string
    name?: string // for free input
  }
  data: {
    all?: number
    prefs?: Record<string, number>
  }

  size_id?: string
  is_trackable?: boolean
  is_warranty?: boolean
}

type EditShippingOptionInput = {
  name?: string
  data: {
    all?: number
    prefs?: Record<string, number>
  }

  size_id: string
  provider: ShippingItemReq
  is_docs?: boolean
}

const ALLOWED_STATUSES = [
  ProductStatus.PUBLISHED,
  ProductStatus.PROPOSED,
  ProductStatus.REJECTED,
]

@Service({ override: MedusaShippingOptionService })
export class ShippingOptionService extends MedusaShippingOptionService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'shippingOptionService'
  protected container_: InjectedDependencies
  protected shippingProfileService_: ShippingProfileService
  protected fulfillmentProviderService_: FulfillmentProviderService
  protected prefectureService_: PrefectureService
  protected productShippingOptionRepo_: typeof ProductShippingOptionsRepository
  protected eventBusService_: EventBusService

  protected shippingOptionRepository_: typeof ShippingOptionRepository

  protected storeRepository_: typeof StoreRepository

  static Events = {
    UPDATE: 'shipping_option.updated',
  }

  constructor(container: InjectedDependencies) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(container)

    this.prefectureService_ = container.prefectureService
    this.fulfillmentProviderService_ = container.fulfillmentProviderService
    this.shippingProfileService_ = container.shippingProfileService
    this.shippingOptionRepository_ = container.shippingOptionRepository
    this.productShippingOptionRepo_ = container.productShippingOptionsRepository
    this.manager_ = container.manager
    this.container_ = container
    this.storeRepository_ = this.container_.storeRepository
    this.eventBusService_ = container.eventBusService
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ShippingOptionService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ShippingOptionService({
      ...this.container_,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async save(storeId: string, createInput: SaveShippingOptionInput) {
    const soRepo: ShippingOptionRepository = this.manager_.getCustomRepository(
      this.shippingOptionRepository_,
    )

    const storeRepo: StoreRepository = this.manager_.getCustomRepository(
      this.storeRepository_,
    )

    const store = await storeRepo.findOne({ id: storeId })
    // fulfillment provider
    const fulfillmentProvider = await this.fulfillmentProviderService_.retrieve(
      createInput.provider.id,
    )

    if (!fulfillmentProvider.is_free) {
      createInput.is_trackable = fulfillmentProvider.is_trackable
      createInput.is_warranty = fulfillmentProvider.is_warranty
    }

    const { data, provider, size_id, ...rest } = createInput

    let providerName: string | undefined = fulfillmentProvider.name

    if (store.plan_type === StorePlanType.PRIME) {
      providerName = provider.name
    } else {
      if (fulfillmentProvider.is_free && provider.name) {
        providerName = provider.name
      }
    }

    let sizeName: string | null = null
    if (size_id) {
      const size = (fulfillmentProvider.metadata as any)?.sizes.find(
        (item) => item.id === size_id,
      )
      if (!size)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Can not find size with id ${size_id}`,
        )

      sizeName = size.name
    }

    const metadata: any = {}
    if (typeof data.all === 'number') {
      metadata.all = data.all
      metadata.prefs = null
    } else if (typeof data.prefs === 'object') {
      metadata.prefs = data.prefs
      metadata.all = null
    }

    const toCreate = {
      ...rest,
      size_id,
      size_name: sizeName,
      provider_id: fulfillmentProvider.id,
      provider_name: providerName,
      store_id: storeId,
      data: metadata,
    }

    return await soRepo.save(soRepo.create(toCreate))
  }

  async update_(
    id: string,
    updateInput: EditShippingOptionInput,
  ): Promise<ShippingOption> {
    return this.atomicPhase_(async (manager) => {
      const option = await this.retrieve(id)
      const optionRepo = manager.getCustomRepository(
        this.shippingOptionRepository_,
      )

      const { provider, size_id, data, ...rest } = updateInput
      const toUpdate: any = { ...rest }

      const fulfillmentProvider =
        await this.fulfillmentProviderService_.retrieve(
          provider?.id || option.provider_id,
        )

      if (!fulfillmentProvider.is_free) {
        toUpdate.is_trackable = fulfillmentProvider.is_trackable
        toUpdate.is_warranty = fulfillmentProvider.is_warranty
      }

      if (provider) {
        toUpdate.provider_id = provider.id
        toUpdate.provider_name = provider.name
      }

      let sizeName: string | null = null
      if (size_id) {
        const size = (fulfillmentProvider.metadata as any)?.sizes.find(
          (item) => item.id === size_id,
        )
        if (!size)
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Can not find size with id ${size_id}`,
          )

        sizeName = size.name
        toUpdate.size_id = size_id
        toUpdate.sizeName = sizeName
      }

      const metadata = option.data
      if (data) {
        if (typeof data.all === 'number') {
          metadata.all = data.all
          metadata.prefs = null
        } else if (typeof data.prefs === 'object') {
          metadata.prefs = data.prefs
          metadata.all = null
        }
        toUpdate.data = metadata
      }

      const result = await optionRepo.save(Object.assign(option, toUpdate))

      await this.eventBusService_
        .withTransaction(manager)
        .emit(ShippingOptionService.Events.UPDATE, { id })

      return result
    })
  }

  async retrieve(
    optionId: string,
    options: { select?: (keyof ShippingOption)[]; relations?: string[] } = {},
  ): Promise<ShippingOption> {
    const manager = this.manager_
    const soRepo: ShippingOptionRepository = manager.getCustomRepository(
      this.shippingOptionRepository_,
    )

    const query: ExtendedFindConfig<ShippingOption> = {
      where: { id: optionId },
    }

    if (options.select) {
      query.select = options.select
    }

    if (options.relations) {
      query.relations = options.relations
    }

    const option = await soRepo.findOne(query)

    if (!option) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Shipping Option with ${optionId} was not found`,
      )
    }

    return option
  }

  async list_(storeId: string) {
    const shippingOptionRepo = this.manager_.getCustomRepository(
      this.shippingOptionRepository_,
    )
    const productShippingOptionRepo = this.manager_.getCustomRepository(
      this.productShippingOptionRepo_,
    )

    const qb = shippingOptionRepo.createQueryBuilder('so')

    qb.where('so.store_id = :storeId', { storeId })
    qb.andWhere('so.status = :spStatus', {
      spStatus: ShippingOptionStatusEnum.ACTIVE,
    })
    qb.orderBy('so.created_at', 'DESC')
    qb.leftJoinAndSelect('so.provider', 'provider')

    const res = await qb.getMany()
    return await Promise.all(
      res.map(async (so) => {
        const usedCnt = await productShippingOptionRepo.count({
          where: [
            {
              shipping_option_id: so.id,
              product: {
                status: In(ALLOWED_STATUSES),
              },
            },
          ],
          relations: ['product'],
        })

        so.used_cnt = usedCnt
        return so
      }),
    )
  }

  async delete(optionId: string): Promise<ShippingOption | void> {
    return await this.atomicPhase_(async (manager) => {
      // try {
      const option = await this.retrieve(optionId)
      const productShippingOptionRepo = this.manager_.getCustomRepository(
        this.productShippingOptionRepo_,
      )

      const productSo = await productShippingOptionRepo.findOne({
        where: [
          {
            shipping_option_id: option.id,
            product: { status: In(ALLOWED_STATUSES) },
          },
        ],
        relations: ['product'],
      })
      if (productSo)
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Can not delete this shipping option',
        )

      const optionRepo = manager.getCustomRepository(
        this.shippingOptionRepository_,
      )

      option.status = ShippingOptionStatusEnum.DELETED
      optionRepo.save(option)

      await this.eventBusService_
        .withTransaction(manager)
        .emit(ShippingOptionService.Events.UPDATE, { id: optionId })
      // } catch (error) {
      //   // Delete is idempotent, but we return a promise to allow then-chaining
      //   return
      // }
    })
  }

  async validateByStore(
    data: (string | ShippingOption)[],
    storeId: string,
  ): Promise<void> {
    const soRepo: ShippingOptionRepository = this.manager_.getCustomRepository(
      this.shippingOptionRepository_,
    )
    const ids = data.map((item) => (typeof item === 'string' ? item : item.id))

    for (const id of ids) {
      const so = await soRepo.findOne({
        id,
        store_id: storeId,
        status: Not(ShippingOptionStatusEnum.DELETED),
      })
      if (!so)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          'Shipping option not found',
        )
    }
  }

  async delete_(optionId: string): Promise<ShippingOption | void> {
    return await this.atomicPhase_(async (manager) => {
      // try {
      const option = await this.retrieve(optionId)
      const productShippingOptionRepo = this.manager_.getCustomRepository(
        this.productShippingOptionRepo_,
      )

      const productSo = await productShippingOptionRepo.findOne({
        where: [
          {
            shipping_option_id: option.id,
            product: { status: In(ALLOWED_STATUSES) },
          },
        ],
        relations: ['product'],
      })
      if (productSo) return

      const optionRepo = manager.getCustomRepository(
        this.shippingOptionRepository_,
      )

      option.status = ShippingOptionStatusEnum.DELETED
      optionRepo.save(option)

      await this.eventBusService_
        .withTransaction(manager)
        .emit(ShippingOptionService.Events.UPDATE, { id: optionId })
    })
  }
}

// optionRepo.update(
//   {
//     id: optionId,
//   },
//   {
//     status: ShippingOptionStatusEnum.DELETED,
//   },
// )
