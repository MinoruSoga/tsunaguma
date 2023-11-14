/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CartRepository } from '@medusajs/medusa/dist/repositories/cart'
import { LineItemRepository } from '@medusajs/medusa/dist/repositories/line-item'
import { LineItemTaxLineRepository } from '@medusajs/medusa/dist/repositories/line-item-tax-line'
import {
  LineItemAdjustmentService,
  LineItemService as MedusaLineItemService,
  PricingService,
  ProductService,
  ProductVariantService,
  RegionService,
  TaxProviderService,
} from '@medusajs/medusa/dist/services'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery, setMetadata } from '@medusajs/medusa/dist/utils'
import { FlagRouter } from '@medusajs/medusa/dist/utils/flag-router'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import UserService from 'src/modules/user/services/user.service'
import { EntityManager, ILike } from 'typeorm'

import { StorePostCartLineItemAddon } from '../controllers/create-line-item.store.controller'
import { LineItem } from '../entity/line-item.entity'
import { LineItemAddonsRepository } from '../repository/line-item-addons.repository'
import { ProductShippingOptionsRepository } from './../../product/repository/product-shipping-options.repository'
import { FulfillmentProviderService } from './../../shipping/services/fulfillment-provider.service'
import { LineItemAddonsService } from './line-item-addons.service'
import { TotalsService } from './totals.service'

type InjectedDependencies = {
  manager: EntityManager
  lineItemRepository: typeof LineItemRepository
  lineItemTaxLineRepository: typeof LineItemTaxLineRepository
  cartRepository: typeof CartRepository
  productVariantService: ProductVariantService
  productService: ProductService
  pricingService: PricingService
  regionService: RegionService
  lineItemAdjustmentService: LineItemAdjustmentService
  taxProviderService: TaxProviderService
  featureFlagRouter: FlagRouter
  lineItemAddonsService: LineItemAddonsService
  lineItemAddonsRepository: typeof LineItemAddonsRepository
  productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  totalsService: TotalsService
  fulfillmentProviderService: FulfillmentProviderService
  userService: UserService
}

@Service({ override: MedusaLineItemService })
export class LineItemService extends MedusaLineItemService {
  static resolutionKey = 'lineItemService'

  private readonly manager: EntityManager
  protected lineItemAddonsService_: LineItemAddonsService
  protected fulfillmentProviderService_: FulfillmentProviderService
  protected totalsService_: TotalsService
  protected lineItemAddonsRepo_: typeof LineItemAddonsRepository
  protected productShippingOptionsRepo_: typeof ProductShippingOptionsRepository

  constructor(private container: InjectedDependencies) {
    super(container)
    this.lineItemAddonsRepo_ = container.lineItemAddonsRepository
    this.lineItemAddonsService_ = container.lineItemAddonsService
    this.totalsService_ = container.totalsService
    this.fulfillmentProviderService_ = container.fulfillmentProviderService
    this.productShippingOptionsRepo_ =
      container.productShippingOptionsRepository
    this.manager = container.manager
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): LineItemService {
    if (!transactionManager) {
      return this
    }

    const cloned = new LineItemService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async addAddonsToLineItem(
    lineItemId: string,
    addons: StorePostCartLineItemAddon[] = [],
    tx?: EntityManager,
  ) {
    tx = tx || this.manager
    const lineItemAddonsRepo = tx.getCustomRepository(this.lineItemAddonsRepo_)
    const currentAddons = await lineItemAddonsRepo.find({
      where: { line_item_id: lineItemId },
    })

    const toDelete = currentAddons.filter(
      (ca) =>
        !addons.some((a) => a.lv1_id === ca.lv1_id && a.lv2_id === ca.lv2_id),
    )

    await lineItemAddonsRepo.remove(toDelete)

    return await Promise.all(
      addons.map(async (addon) => {
        // add or update that addon
        await lineItemAddonsRepo.save(
          lineItemAddonsRepo.create({
            ...addon,
            line_item_id: lineItemId,
          }),
        )
      }),
    )
  }

  async create(data: Partial<LineItem>): Promise<LineItem> {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const lineItemRepository = transactionManager.getCustomRepository(
          this.lineItemRepository_,
        )

        const metadata = data.metadata

        const lineItem = lineItemRepository.create(data) as LineItem
        if (metadata) {
          lineItem.metadata = _.omit(metadata, 'addons')
        }
        const productVariant = await this.productVariantService_.retrieve(
          lineItem.variant_id,
          { select: ['id'], relations: ['product'] },
        )

        // attach store to that line item
        if (!lineItem.store_id) {
          // @ts-ignore
          lineItem.store_id = productVariant.product.store_id
        }

        const newLineItem = (await lineItemRepository.save(
          lineItem,
        )) as LineItem

        // add addons to line item
        // @ts-ignore
        if (metadata && metadata.addons?.length > 0) {
          const lineItemAddons = metadata.addons as StorePostCartLineItemAddon[]
          await this.addAddonsToLineItem(
            newLineItem.id,
            lineItemAddons,
            transactionManager,
          )
        }

        return newLineItem
      },
    )
  }

  async update(
    idOrSelector: string | Selector<LineItem>,
    data: Partial<LineItem>,
  ): Promise<LineItem[]> {
    const { metadata, ...rest } = data

    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const lineItemRepository = transactionManager.getCustomRepository(
          this.lineItemRepository_,
        )

        const selector =
          typeof idOrSelector === 'string' ? { id: idOrSelector } : idOrSelector

        let lineItems = await this.list(selector)

        if (!lineItems.length) {
          const selectorConstraints = Object.entries(selector)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')

          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Line item with ${selectorConstraints} was not found`,
          )
        }

        lineItems = lineItems.map((item) => {
          const lineItemMetadata = metadata
            ? setMetadata(item, _.omit(metadata, 'addons'))
            : item.metadata

          return Object.assign(item, {
            ...rest,
            metadata: lineItemMetadata,
          })
        })

        const updatedLineItems = (await lineItemRepository.save(
          lineItems,
        )) as LineItem[]

        // @ts-ignore
        if (metadata && metadata.addons?.length > 0) {
          const lineItemAddons = metadata.addons as StorePostCartLineItemAddon[]
          await Promise.all(
            updatedLineItems.map(async (updatedLineItem) => {
              return await this.addAddonsToLineItem(
                updatedLineItem.id,
                lineItemAddons,
                transactionManager,
              )
            }),
          )
        }

        return updatedLineItems
      },
    )
  }

  async deleteItems(id: string) {
    return await this.atomicPhase_(
      async (transactionManager: EntityManager) => {
        const lineItemRepository = transactionManager.getCustomRepository(
          this.lineItemRepository_,
        )

        return await lineItemRepository
          .findOne({ where: { id } })
          .then((lineItem) => lineItem && lineItemRepository.remove(lineItem))
      },
    )
  }

  async getListItemsByStore(
    storeId: string,
    selector: Selector<LineItem>,
    config: FindConfig<LineItem>,
  ) {
    const lineItemRepository = this.manager.getCustomRepository(
      this.lineItemRepository_,
    )

    const search = selector['search']

    delete selector['search']

    const query = buildQuery(selector, config)
    if (search) {
      query.where = [
        { order: { customer: { nickname: ILike(`%${search}%`) } } },
      ]
    }

    query.relations = ['order', 'order.customer', 'line_item_addons']

    switch (selector['status']) {
      case 'new_order':
        if (search) {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'pending',
                payment_status: 'not_paid',
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
            {
              order: {
                store_id: storeId,
                status: 'pending',
                payment_status: 'awaiting',
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
            {
              order: {
                store_id: storeId,
                status: 'pending',
                payment_status: 'captured',
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
          ]
        } else {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'pending',
                payment_status: 'not_paid',
              },
            },
            {
              order: {
                store_id: storeId,
                status: 'pending',
                payment_status: 'awaiting',
              },
            },
            {
              order: {
                store_id: storeId,
                status: 'pending',
                payment_status: 'captured',
              },
            },
          ]
        }
        break
      case 'preparing_to_ship':
        if (search) {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'pending',
                fulfillment_status: 'fulfilled',
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
          ]
        } else {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'pending',
                fulfillment_status: 'fulfilled',
              },
            },
          ]
        }
        break
      case 'shipping_completed':
        if (search) {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'pending',
                fulfillment_status: 'shipped',
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
          ]
        } else {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'pending',
                fulfillment_status: 'shipped',
              },
            },
          ]
        }
        break
      case 'transaction_completed':
        if (search) {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'completed',
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
          ]
        } else {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'completed',
              },
            },
          ]
        }
        break
      case 'cancel':
        if (search) {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'canceled',
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
          ]
        } else {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'canceled',
              },
            },
          ]
        }
        break
      case 'returns':
        if (search) {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'return',
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
          ]
        } else {
          query.where = [
            {
              order: {
                store_id: storeId,
                status: 'return',
              },
            },
          ]
        }
        break
      default:
        if (search) {
          query.where = [
            {
              order: {
                store_id: storeId,
                customer: { nickname: ILike(`%${search}%`) },
              },
            },
          ]
        } else {
          query.where = [
            {
              order: {
                store_id: storeId,
              },
            },
          ]
        }
        break
    }
    return await lineItemRepository.findAndCount(query)
  }

  async getShippingOptions(lineItemId: string) {
    const lineItem = await this.retrieve(lineItemId, {
      select: ['id', 'cart_id'],
      relation: ['variant', 'variant.product'],
    })
    const cartRepo = this.manager.getCustomRepository(this.cartRepository_)

    const cart = await cartRepo.findOne(lineItem.cart_id)

    if (!lineItem) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Line item with id ${lineItemId} was not found`,
      )
    }

    const productShippingOptionsRepo = this.manager.getCustomRepository(
      this.productShippingOptionsRepo_,
    )

    const result = await productShippingOptionsRepo.find({
      where: { product_id: lineItem.variant.product_id },
      relations: ['shipping_option', 'shipping_option.provider'],
    })

    return await Promise.all(
      result.map(async (pso) => {
        const price = await this.fulfillmentProviderService_.calculatePrice(
          pso.shipping_option,
          {},
          cart,
        )
        return {
          ...pso,
          shipping_option: Object.assign(pso.shipping_option, {
            amount: price,
          }),
        }
      }),
    )
  }
}
