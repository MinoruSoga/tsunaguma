import { Cart } from '@medusajs/medusa'
import { AddressRepository } from '@medusajs/medusa/dist/repositories/address'
import { FulfillmentProviderService as MedusaFulfillmentProviderService } from '@medusajs/medusa/dist/services'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { MedusaContainer, Service } from 'medusa-extender'
import BaseFulfillmentService from 'medusa-interfaces/dist/fulfillment-service'
import { DeepPartial, EntityManager, FindManyOptions, ILike } from 'typeorm'

import { FulfillmentProvider } from '../entities/fulfillment-provider.entity'
import { ShippingOption } from '../entities/shipping-option.entity'
import { FulfillmentProviderRepository } from '../repositories/fulfillment-provider.repository'
import { Order } from './../../order/entity/order.entity'

type FulfillmentProviderKey = `fp_${string}`

type InjectedDependencies = MedusaContainer & {
  fulfillmentProviderRepository: typeof FulfillmentProviderRepository
  manager: EntityManager
  logger: Logger
  addressRepository: typeof AddressRepository
} & {
  [key in `${FulfillmentProviderKey}`]: typeof BaseFulfillmentService
}

@Service({ override: MedusaFulfillmentProviderService })
export class FulfillmentProviderService extends MedusaFulfillmentProviderService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'fulfillmentProviderService'
  protected container: InjectedDependencies
  protected logger_: Logger

  protected fulfillmentProviderRepository_: typeof FulfillmentProviderRepository
  protected addressRepository_: typeof AddressRepository

  constructor(container: InjectedDependencies) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(container)

    this.logger_ = container.logger
    this.fulfillmentProviderRepository_ =
      container.fulfillmentProviderRepository
    this.addressRepository_ = container.addressRepository
    this.manager_ = container.manager
    this.container = container
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(
    transactionManager: EntityManager,
  ): FulfillmentProviderService {
    if (!transactionManager) {
      return this
    }

    const cloned = new FulfillmentProviderService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async create(
    provider: DeepPartial<FulfillmentProvider>,
  ): Promise<FulfillmentProvider> {
    const providerRepo = this.manager_.getCustomRepository(
      this.fulfillmentProviderRepository_,
    )
    const toSaveData = providerRepo.create(provider)
    return await providerRepo.save(toSaveData)
  }

  async retrieve(
    providerId: string,
    config: FindConfig<FulfillmentProvider> = {},
  ): Promise<FulfillmentProvider | never> {
    const providerRepo = this.manager_.getCustomRepository(
      this.fulfillmentProviderRepository_,
    )

    const query = buildQuery<
      Pick<FulfillmentProvider, 'id'>,
      FulfillmentProvider
    >({ id: providerId }, config)
    const provider = await providerRepo.findOne(query)

    if (!provider) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Fulfillment provider with ${provider} was not found`,
      )
    }

    return provider
  }

  async retrieveTitle(title: string): Promise<FulfillmentProvider | never> {
    const providerRepo = this.manager_.getCustomRepository(
      this.fulfillmentProviderRepository_,
    )

    const query = buildQuery({ name: ILike(`${title}%`) })

    const provider = await providerRepo.findOne(query)

    return provider
  }

  async list(options: FindManyOptions<FulfillmentProvider> = {}) {
    const providerRepo = this.manager_.getCustomRepository(
      this.fulfillmentProviderRepository_,
    )

    return await providerRepo.find(options)
  }

  async registerInstalledProviders() {
    this.logger_.info('Register installed providers not implemented')
  }

  async deleteAll() {
    const providerRepo = this.manager_.getCustomRepository(
      this.fulfillmentProviderRepository_,
    )

    await providerRepo.clear()
  }

  async calculatePrice(
    option: ShippingOption,
    data: Record<string, unknown>,
    cart?: Order | Cart,
  ): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const provider = await this.retrieve(option.provider_id)
    const addressRepo = this.manager_.getCustomRepository(
      this.addressRepository_,
    )

    const optionData = option.data
    if (typeof optionData?.all === 'number') return optionData.all

    if (optionData?.prefs) {
      // calculate shipping fee here
      const optionPriceData: any = optionData.prefs
      let province
      if (cart && cart.shipping_address) {
        province = cart.shipping_address.province
      } else if (cart && cart.shipping_address_id) {
        const address = await addressRepo.findOne(cart.shipping_address_id)
        if (!address)
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Shipping address with id ${cart.shipping_address_id} not found`,
          )

        province = address.province
      }

      if (province) {
        // const area = optionPriceData?.find((item) =>
        //   Boolean(item?.pref?.find((p) => p.id === province)),
        // )
        // if (!area) {
        //   throw new MedusaError(
        //     MedusaError.Types.NOT_FOUND,
        //     `Can not find area of prefecture id ${province}`,
        //   )
        // }
        // return area.price || 0
        return optionPriceData?.[province] || 0
      }
    }

    return 0
  }

  async validateFulfillmentData(
    option: ShippingOption,
    data: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cart: Cart | Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return data
  }
}
