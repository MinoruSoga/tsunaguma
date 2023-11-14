import {
  IPriceSelectionStrategy,
  PriceListStatus,
  PriceListType,
} from '@medusajs/medusa'
import {
  ProductOptionValue,
  ProductVariant,
} from '@medusajs/medusa/dist/models'
import { CartRepository } from '@medusajs/medusa/dist/repositories/cart'
import { MoneyAmountRepository } from '@medusajs/medusa/dist/repositories/money-amount'
import { PriceListRepository } from '@medusajs/medusa/dist/repositories/price-list'
import { ProductOptionRepository } from '@medusajs/medusa/dist/repositories/product-option'
import { ProductOptionValueRepository } from '@medusajs/medusa/dist/repositories/product-option-value'
import { ProductVariantRepository } from '@medusajs/medusa/dist/repositories/product-variant'
import {
  EventBusService,
  ProductVariantService as MedusaProductVariantService,
  RegionService,
} from '@medusajs/medusa/dist/services'
import { setMetadata } from '@medusajs/medusa/dist/utils'
import { isDefined } from 'class-validator'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import { ExtendedAdminPostProductVariantsReq } from '../controllers/create-product.admin.controller'
import ProductRepository from '../repository/product.repository'

type ConstructorParams = {
  manager: EntityManager
  productRepository: typeof ProductRepository
  productVariantRepository: typeof ProductVariantRepository
  productOptionRepository: typeof ProductOptionRepository
  eventBusService: EventBusService
  cartRepository: typeof CartRepository
  priceSelectionStrategy: IPriceSelectionStrategy
  regionService: RegionService
  moneyAmountRepository: typeof MoneyAmountRepository
  productOptionValueRepository: typeof ProductOptionValueRepository
  priceListRepository: typeof PriceListRepository
}

export enum ProductOptions {
  COLOR = 'opt_color',
  SIZE = 'opt_size',
}

export function genVariantTitle(color?: string, size?: string) {
  if (color && size) return `${color} / ${size}`

  if (color && !size) return `${color} / -`
  if (!color && size) return `- / ${size}`

  return ''
}

export function getProductVariantSku(options?: ProductOptionValue[]) {
  if (!options?.length) return ''

  const color = options.find(
    (option) => option.option_id === 'opt_color',
  )?.value
  const size = options.find((option) => option.option_id === 'opt_size')?.value

  return genVariantTitle(color, size)
}

@Service({ override: MedusaProductVariantService })
export class ProductVariantService extends MedusaProductVariantService {
  readonly manager: EntityManager
  protected productRepository_: typeof ProductRepository
  protected productVariantRepository_: typeof ProductVariantRepository
  protected productOptionRepository_: typeof ProductOptionRepository
  protected moneyAmountRepository_: typeof MoneyAmountRepository
  protected productOptionValueRepository_: typeof ProductOptionValueRepository
  protected priceListRepository_: typeof PriceListRepository

  constructor(private readonly container: ConstructorParams) {
    super(container)
    this.container = container
    this.manager = container.manager
    this.productRepository_ = container.productRepository
    this.productVariantRepository_ = container.productVariantRepository
    this.productOptionRepository_ = container.productOptionRepository
    this.moneyAmountRepository_ = container.moneyAmountRepository
    this.productOptionValueRepository_ = container.productOptionValueRepository
    this.priceListRepository_ = container.priceListRepository
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ProductVariantService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ProductVariantService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async create(
    productId: string,
    variant: ExtendedAdminPostProductVariantsReq,
  ): Promise<ProductVariant> {
    return await this.atomicPhase_(async (manager) => {
      const variantRepo = manager.getCustomRepository(
        this.productVariantRepository_,
      )
      const priceListRepo = manager.getCustomRepository(
        this.priceListRepository_,
      )
      const moneyAmountRepo = manager.getCustomRepository(
        this.moneyAmountRepository_,
      )

      const { prices, color, size, ...rest } = variant

      if (!prices?.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'the prices is empty!',
        )
      }

      let productVariant = variantRepo.create({
        ...rest,
        product_id: productId,
      })

      if (color && size) {
        productVariant.sku = `${productId} / ${color} / ${size}`
      }

      if (color || size) {
        productVariant.title = genVariantTitle(color, size)
      }

      productVariant = await variantRepo.save(productVariant)

      await this.addOptionValue(
        productVariant.id,
        ProductOptions.COLOR,
        color || '',
      )

      await this.addOptionValue(
        productVariant.id,
        ProductOptions.SIZE,
        size || '',
      )

      const priceIdx = prices[0].is_sale ? 1 : 0
      await this.setCurrencyPrice(productVariant.id, {
        amount: prices[priceIdx].amount,
        currency_code: JAPANESE_CURRENCY_CODE,
      })

      const salePrice = prices[priceIdx === 0 ? 1 : 0]
      if (salePrice) {
        const moneyAmount = moneyAmountRepo.create({
          amount: salePrice.amount,
          currency_code: JAPANESE_CURRENCY_CODE,
          variant_id: productVariant.id,
        })
        let priceList = priceListRepo.create({
          name: productVariant.id,
          description: productVariant.id,
          type: PriceListType.SALE,
          status: PriceListStatus.ACTIVE,
          starts_at: salePrice.starts_at,
          ends_at: salePrice.ends_at,
        })
        priceList = await priceListRepo.save(priceList)
        moneyAmount.price_list_id = priceList.id
        await moneyAmountRepo.save(moneyAmount)
      }

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductVariantService.Events.CREATED, {
          id: productVariant.id,
          product_id: productVariant.product_id,
        })

      return productVariant
    })
  }

  async update(
    variantOrVariantId: string | Partial<ProductVariant>,
    update: ExtendedAdminPostProductVariantsReq,
  ): Promise<ProductVariant> {
    return await this.atomicPhase_(async (manager: EntityManager) => {
      const variantRepo = manager.getCustomRepository(
        this.productVariantRepository_,
      )
      const priceListRepo = manager.getCustomRepository(
        this.priceListRepository_,
      )
      const moneyAmountRepo = manager.getCustomRepository(
        this.moneyAmountRepository_,
      )

      let variant = variantOrVariantId
      if (typeof variant === 'string') {
        variant = await variantRepo.findOne({
          where: { id: variantOrVariantId },
        })
        if (!isDefined(variant)) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Variant with id ${variantOrVariantId} was not found`,
          )
        }
      } else if (!variant.id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Variant id missing`,
        )
      }

      const {
        prices,
        color,
        size,
        options,
        metadata,
        inventory_quantity,
        ...rest
      } = update

      if (prices) {
        if (!prices.length) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            'the prices is empty!',
          )
        }

        await moneyAmountRepo.delete({
          variant_id: variant.id,
        })
        await priceListRepo.delete({
          name: variant.id,
        })

        const priceIdx = prices[0].is_sale ? 1 : 0
        await this.setCurrencyPrice(variant.id, {
          amount: prices[priceIdx].amount,
          currency_code: JAPANESE_CURRENCY_CODE,
        })
        const salePrice = prices[priceIdx === 0 ? 1 : 0]
        if (salePrice) {
          const moneyAmount = moneyAmountRepo.create({
            amount: salePrice.amount,
            currency_code: JAPANESE_CURRENCY_CODE,
            variant_id: variant.id,
          })
          let priceList = priceListRepo.create({
            name: variant.id,
            description: variant.id,
            type: PriceListType.SALE,
            status: PriceListStatus.ACTIVE,
            starts_at: salePrice.starts_at,
            ends_at: salePrice.ends_at,
          })
          priceList = await priceListRepo.save(priceList)
          moneyAmount.price_list_id = priceList.id
          await moneyAmountRepo.save(moneyAmount)
        }
      }

      if (color !== undefined) {
        await this.updateOptionValue(
          variant.id,
          ProductOptions.COLOR,
          color || '',
        )
      }

      if (size !== undefined) {
        await this.updateOptionValue(
          variant.id,
          ProductOptions.SIZE,
          size || '',
        )
      }

      if (options) {
        for (const option of options) {
          await this.updateOptionValue(
            variant.id,
            option.option_id,
            option.value,
          )
        }
      }

      if (typeof metadata === 'object') {
        variant.metadata = setMetadata(variant as ProductVariant, metadata)
      }

      if (typeof inventory_quantity === 'number') {
        variant.inventory_quantity = inventory_quantity as number
      }

      for (const [key, value] of Object.entries(rest)) {
        variant[key] = value
      }

      if (color && size) {
        variant.sku = `${variant.product_id} / ${color} / ${size}`
      }

      if (color || size) {
        variant.title = genVariantTitle(color, size)
      }
      //  else if (!variant.sku) {
      //   variant.sku = variant.product_id
      //   variant.title = ''
      // }
      const result = await variantRepo.save(variant)

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductVariantService.Events.UPDATED, {
          id: result.id,
          product_id: result.product_id,
          fields: Object.keys(update),
        })

      return result
    })
  }

  async updateOptionValue(
    variantId: string,
    optionId: string,
    optionValue: string,
  ): Promise<ProductOptionValue> {
    return await this.atomicPhase_(async (manager: EntityManager) => {
      const productOptionValueRepo = manager.getCustomRepository(
        this.productOptionValueRepository_,
      )

      const productOptionValue = await productOptionValueRepo.findOne({
        where: { variant_id: variantId, option_id: optionId },
      })

      if (!productOptionValue) {
        return await this.addOptionValue(variantId, optionId, optionValue)
      }

      productOptionValue.value = optionValue

      return await productOptionValueRepo.save(productOptionValue)
    })
  }

  async update_(variantId: string, data: DeepPartial<ProductVariant>) {
    const variantRepo = this.manager.getCustomRepository(
      this.productVariantRepository_,
    )

    await variantRepo.update({ id: variantId }, data)
  }

  async softRemove(variantId: string) {
    const variantRepo = this.manager.getCustomRepository(
      this.productVariantRepository_,
    )

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await variantRepo.update({ id: variantId }, { is_deleted: true })
  }
}
