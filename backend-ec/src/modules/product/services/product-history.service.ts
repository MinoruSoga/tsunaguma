import {
  defaultAdminProductRelations,
  TransactionBaseService,
} from '@medusajs/medusa'
import { FindWithoutRelationsOptions } from '@medusajs/medusa/dist/repositories/product'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { FindProductConfig } from '@medusajs/medusa/dist/types/product'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, Not } from 'typeorm'

import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import { FulfillmentProvider } from '../../shipping/entities/fulfillment-provider.entity'
import { ShippingOptionStatusEnum } from '../../shipping/entities/shipping-option.entity'
import { User } from '../../user/entity/user.entity'
import {
  ProductDetailAddonRes,
  ProductDetailCmsRes,
  ProductDetailShippingOptionRes,
  ProductDetailVariantRes,
} from '../controllers/get-product-detail.cms.admin.controller'
import { Product, ProductStatusEnum } from '../entity/product.entity'
import { ProductHistory } from '../entity/product-history.entity'
import ProductRepository from '../repository/product.repository'
import { ProductHistoryRepository } from '../repository/product-history.repository'
import { ProductShippingOptionsRepository } from '../repository/product-shipping-options.repository'
import { ProductAddonsService } from './product-addons.service'

type InjectedDependencies = {
  manager: EntityManager
  productHistoryRepository: typeof ProductHistoryRepository
  productRepository: typeof ProductRepository
  loggedInUser?: User
  productShippingOptionsRepository: typeof ProductShippingOptionsRepository
  productAddonsService: ProductAddonsService
}

export const defaultProductRelations = [
  'variants',
  'tags',
  'type_lv1',
  'type_lv2',
  'ship_from',
  'product_material',
  'product_specs',
  'product_addons',
  'product_shipping_options',
  'product_images',
]

function orderByRank<T extends { rank: number }>(a: T, b: T) {
  return a.rank - b.rank
}

@Service({ scope: 'SCOPED' })
export class ProductHistoryService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  static resolutionKey = 'productHistoryService'

  protected readonly productHistoryRepository_: typeof ProductHistoryRepository
  protected readonly productRepository_: typeof ProductRepository
  protected productShippingOptionsRepository_: typeof ProductShippingOptionsRepository
  protected productAddonsService_: ProductAddonsService

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.manager_ = container.manager
    this.productHistoryRepository_ = container.productHistoryRepository
    this.productRepository_ = container.productRepository
    this.productShippingOptionsRepository_ =
      container.productShippingOptionsRepository
    this.productAddonsService_ = container.productAddonsService
  }

  async listHistory(productId: string, config: FindConfig<ProductHistory>) {
    const productHisRepo = this.manager_.getCustomRepository(
      this.productHistoryRepository_,
    )
    const query = buildQuery({ product_id: productId }, config)

    return await productHisRepo.findAndCount(query)
  }

  async create(productId: string, userId?: string) {
    const productHisRepo = this.manager_.getCustomRepository(
      this.productHistoryRepository_,
    )

    const relations = defaultAdminProductRelations.concat([
      'ship_from',
      'store',
      'store.store_detail',
      'store.owner',
      'store.customer',
      'product_images',
      'product_images.image',
      'product_material',
      'product_specs',
      'product_specs.lv1',
      'product_specs.lv2',
      'product_specs.lv3',
      'product_colors',
      'product_colors.color',
    ])

    const rawProduct = (await this.retrieve_(
      { id: productId, status: Not(ProductStatusEnum.deleted) },
      { currency_code: JAPANESE_CURRENCY_CODE, relations },
    )) as Product

    if (rawProduct.product_images?.length) {
      rawProduct.product_images = rawProduct.product_images.sort(orderByRank)
      rawProduct.images = rawProduct.product_images.map(({ image }) => image)
    }
    if (rawProduct.product_specs?.length) {
      rawProduct.product_specs = rawProduct.product_specs.sort(orderByRank)
    }
    if (rawProduct.product_addons?.length) {
      rawProduct.product_addons = rawProduct.product_addons.sort(orderByRank)
    }
    if (rawProduct.product_colors?.length) {
      rawProduct.product_colors = rawProduct.product_colors.sort(orderByRank)
    }
    if (rawProduct.product_shipping_options?.length) {
      rawProduct.product_shipping_options =
        rawProduct.product_shipping_options.sort(orderByRank)
    }

    if (rawProduct.variants?.length) {
      rawProduct.variants = rawProduct.variants.filter((v) => !v.is_deleted)
    }

    const convertedProduct = await this.convertProductDetailCms(rawProduct)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = convertedProduct
    const history = productHisRepo.create({
      product_id: productId,
      metadata: rest,
      user_id: userId || this.container_.loggedInUser.id,
    })

    return await productHisRepo.save(history)
  }

  async getOne(id: string) {
    const productHistoryRepo_ = this.manager_.getCustomRepository(
      this.productHistoryRepository_,
    )
    const history = productHistoryRepo_.findOne({
      where: { id },
    })
    return history
  }

  async retrieve_(
    selector: Selector<Product>,
    config: FindProductConfig = {
      include_discount_prices: false,
    },
  ): Promise<Product> {
    const manager = this.manager_
    const productRepo = manager.getCustomRepository(this.productRepository_)

    const { relations, ...query } = buildQuery(selector, config)

    const product = await productRepo.findOneWithRelations(
      relations,
      query as FindWithoutRelationsOptions,
    )

    if (!product) {
      const selectorConstraints = Object.entries(selector)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')

      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with ${selectorConstraints} was not found`,
      )
    }

    return product as Product
  }

  async convertProductDetailCms(
    product: Product,
  ): Promise<ProductDetailCmsRes> {
    let result = {} as ProductDetailCmsRes

    const defaultFields = [
      'id',
      'description',
      'remarks',
      'title',
      'created_at',
      'updated_at',
      'like_cnt',
      'ship_after',
      'store_id',
      'metadata',
      'type_id',
      'type_lv1_id',
      'type_lv2_id',
      'thumbnail',
      'gift_cover',
      'is_customizable',
      'is_maker_ship',
      'status',
      'margin_rate',
      'spec_rate',
      'spec_starts_at',
      'spec_ends_at',
      'display_id',
      'display_code',
      'ship_from_id',
      'is_return_guarantee',
    ]

    result = Object.assign(result, _.pick(product, defaultFields))
    result.ship_from = product.ship_from?.name
    result.is_liked = false
    result.images = product.images.map((image) => ({
      id: image.id,
      url: image.url,
    }))

    result.store = _.pick(product.store, [
      'id',
      'name',
      'store_detail',
      'owner',
      'customer',
      'display_id',
    ])

    result.store.store_detail = product?.store?.store_detail
      ? _.pick(product.store.store_detail, ['id', 'company_name'])
      : { id: '', company_name: '' }

    result.store.owner = _.pick(product.store.owner, ['id', 'nickname'])
    result.store.customer = _.pick(product.store.customer, ['display_id'])
    result.tags = product.tags.map((tag) => ({ id: tag.id, value: tag.value }))

    result.material = _.pick(product.product_material, ['id', 'name'])

    result.specs = product.product_specs

    result.is_return_guarantee = product.is_return_guarantee

    const colors = product.product_colors.map((color) => ({
      ..._.pick(color, ['color']),
    }))
    result.colors = colors

    const addons = await this.listAddons(product.id)
    result.addons = addons

    const variants: ProductDetailVariantRes[] = product.variants.map(
      (variant) => ({
        ..._.pick(variant, [
          'id',
          'inventory_quantity',
          'sku',
          'title',
          'prices',
          'manage_inventory',
        ]),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        price: variant.calculated_price,
        color: variant.options.find(
          (option) => option.option_id === 'opt_color',
        )?.value,
        size: variant.options.find((option) => option.option_id === 'opt_size')
          ?.value,
      }),
    )
    result.variants = variants

    const shipping_options = await this.listShippingOptions(product.id)
    result.shipping_options = shipping_options

    return result
  }

  async listAddons(productId: string): Promise<ProductDetailAddonRes[]> {
    const product = await this.retrieve(productId, { select: ['id'] })
    const productAddons = await this.productAddonsService_.getProductAddons(
      product.id,
    )

    const res = productAddons.map((pas) => ({
      id: pas.lv1.id,
      name: pas.lv1.name,
      rank: pas.lv1.rank,
      children: pas.lv1.children.map((pasc) => ({
        id: pasc.id,
        name: pasc.name,
        price: pasc.price,
        children: [],
        rank: pasc.rank,
      })),
    }))

    res.sort((a, b) => a.rank - b.rank)

    for (const item of res) {
      item.children.sort((a, b) => a.rank - b.rank)
    }

    return res
  }

  async listShippingOptions(
    productId: string,
  ): Promise<ProductDetailShippingOptionRes[]> {
    const productShippingOptionsRepo = this.manager_.getCustomRepository(
      this.productShippingOptionsRepository_,
    )
    const qb = productShippingOptionsRepo.createQueryBuilder('pso')
    qb.leftJoinAndSelect('pso.shipping_option', 'so')
    qb.leftJoinAndSelect('so.provider', 'provider')
    qb.where('pso.product_id = :productId', { productId })
    qb.andWhere('so.status = :status', {
      status: ShippingOptionStatusEnum.ACTIVE,
    })
    qb.orderBy('pso.rank', 'ASC')

    const result = await qb.getMany()
    return result.map((item) => ({
      id: item.shipping_option.id,
      is_trackable: item.shipping_option.is_trackable,
      is_warranty: item.shipping_option.is_warranty,
      name: (item.shipping_option.provider as FulfillmentProvider)?.is_free
        ? item.shipping_option.provider_name
        : (item.shipping_option.provider as FulfillmentProvider).name,
      bulk_added_price: item.bulk_added_price,
      amount: item.shipping_option.amount,
      data: item.shipping_option.data,
      fulfillment: item.shipping_option.provider as FulfillmentProvider,
      rank: item.rank,
      metadata: item.shipping_option.metadata,
    }))
  }

  async retrieve(
    productId: string,
    config: FindProductConfig = {
      include_discount_prices: false,
    },
  ): Promise<Product> {
    return await this.retrieve_({ id: productId }, config)
  }
}
