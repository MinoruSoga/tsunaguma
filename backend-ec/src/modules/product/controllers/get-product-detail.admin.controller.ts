/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  defaultAdminProductRelations,
  MoneyAmount,
  PricingService,
} from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { In, Not } from 'typeorm'

import { CacheService } from '../../../modules/cache/cache.service'
import { Prefecture } from '../../prefecture/entity/prefecture.entity'
import { StorePlanType, StoreStatus } from '../../store/entity/store.entity'
import {
  GiftCoverEnum,
  Product,
  ProductStatusEnum,
} from '../entity/product.entity'
import { ProductColor } from '../entity/product-color.entity'
import { ProductSpecs } from '../entity/product-specs.entity'
import { ProductService } from '../services/product.service'
import { JAPANESE_CURRENCY_CODE } from './../../../helpers/constant'
import { FulfillmentProvider } from './../../shipping/entities/fulfillment-provider.entity'

/**
 * @oas [get] /products/{id}
 * operationId: "GetProductDetail"
 * summary: "Get a Product"
 * description: "Retrieves a Product."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product.
 *   - (query) tmp_user_id {string} Temporary user id
 *   - (query) user_id {string} user id
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *               $ref: "#/components/schemas/ProductDetailRes"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */

export default async (req: MedusaRequest, res: Response) => {
  const { id } = req.params
  const productService: ProductService = req.scope.resolve('productService')
  const pricingService: PricingService = req.scope.resolve('pricingService')
  const cacheService: CacheService = req.scope.resolve('cacheService')

  req.retrieveConfig = req.retrieveConfig ?? {}
  const validated = await validator(GetProductDetailReq, req.query)

  const cacheKey = `prod-detail-${id}`
  let convertedProduct = await cacheService.get<ProductDetailRes>(cacheKey)
  if (!convertedProduct) {
    const relations =
      req.retrieveConfig.relations ||
      defaultAdminProductRelations.concat([
        'ship_from',
        'store',
        'store.store_detail',
        'store.owner',
        'product_material',
        'product_specs',
        'product_specs.lv1',
        'product_specs.lv2',
        'product_specs.lv3',
        'product_colors',
        'product_colors.color',
        'product_images',
      ])

    const rawProduct = (await productService.retrieve_(
      {
        id,
        status: Not(
          In([
            ProductStatusEnum.deleted,
            ProductStatusEnum.delivery_request,
            ProductStatusEnum.draft,
            ProductStatusEnum.rejected,
          ]),
        ),
      },
      { currency_code: JAPANESE_CURRENCY_CODE, relations },
    )) as Product

    const [product] = (await pricingService.setProductPrices([rawProduct], {
      currency_code: JAPANESE_CURRENCY_CODE,
    })) as Product[]

    // temp filter deleted variants
    if (product.variants?.length) {
      product.variants = product.variants.filter((v) => !v.is_deleted)
    }

    convertedProduct = await productService.convertProductDetail(product)

    await cacheService.set(cacheKey, convertedProduct, 300)
  }
  convertedProduct = (await productService.decorateFavorite(
    convertedProduct,
    validated.user_id,
    validated.tmp_user_id,
  )) as ProductDetailRes

  res.json(convertedProduct)
}

/**
 * @schema ProductDetailRes
 * title: "ProductDetailRes"
 * description: "Get product detail"
 * x-resourceId: ProductDetailRes
 * type: object
 * required:
 *     - id
 *     - title
 *     - tags
 *     - images
 *     - created_at
 *     - updated_at
 *     - like_cnt
 *     - gift_cover
 *     - description
 *     - variants
 *     - addons
 *     - shipping_options
 *     - ship_after
 *     - ship_from
 *     - store_id
 *     - metadata
 *     - type_id
 *     - thumbnail
 * properties:
 *     title:
 *       description: "Title of product"
 *       type: string
 *       example: Product 1
 *     id:
 *       description: "id of the product"
 *       type: string
 *       example: prod_1
 *     tags:
 *       type: array
 *       items:
 *        $ref: "#/components/schemas/ProductDetailTagRes"
 *     images:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/ProductDetailImageRes"
 *     created_at:
 *       type: string
 *       description: "The date with timezone at which the resource was created."
 *       format: date-time
 *     updated_at:
 *       type: string
 *       description: "The date with timezone at which the resource was updated."
 *       format: date-time
 *     is_liked:
 *       type: boolean
 *       description: "User like product or not"
 *     like_cnt:
 *       type: number
 *       description: "Total like count of product"
 *     store_id:
 *       type: string
 *     gift_cover:
 *       $ref: "#/components/schemas/GiftCoverEnum"
 *     description:
 *       type: string
 *     is_customizable:
 *       type: boolean
 *     remarks:
 *       type: string
 *     variants:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/ProductDetailVariantRes"
 *     addons:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/ProductDetailAddonRes"
 *     shipping_options:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/ProductDetailShippingOptionAddonRes"
 *     shipping_prefectures:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/prefecture"
 *     material:
 *       $ref: "#/components/schemas/ProductMaterialRes"
 *     store:
 *       $ref: "#/components/schemas/ProductStoreRes"
 *     specs:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/product_specs"
 *     colors:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/ProductColorsRes"
 *     ship_after:
 *       type: string
 *     ship_from:
 *       type: string
 *     metadata:
 *       type: object
 *       description: An optional key-value map with additional details
 *       example: {car: "white"}
 *     type_id:
 *       type: string
 *     type_lv1_id:
 *       type: string
 *     type_lv2_id:
 *       type: string
 *     thumbnail:
 *       type: string
 *     status:
 *       description: The status of the product
 *       type: string
 *       enum:
 *        - draft
 *        - proposed
 *        - published
 *        - rejected
 *     is_maker_ship:
 *       type: boolean
 *     is_free_shipping:
 *       type: boolean
 */

/**
 * @schema ProductDetailTagRes
 * title: "ProductDetailTagRes"
 * description: "Product detail tag"
 * x-resourceId: ProductDetailTagRes
 * type: object
 * required:
 *    - id
 *    - value
 * properties:
 *    id:
 *     type: string
 *    value:
 *     type: string
 */

type ProductDetailTagRes = {
  id: string
  value: string
}

/**
 * @schema ProductDetailImageRes
 * title: "ProductDetailImageRes"
 * description: "Product detail images"
 * x-resourceId: ProductDetailImageRes
 * type: object
 * required:
 *    - id
 *    - url
 * properties:
 *    id:
 *     type: string
 *    url:
 *     type: string
 *    rank:
 *     type: number
 */

type ProductDetailImageRes = {
  id: string
  url: string
  rank: number
}

/**
 * @schema ProductDetailAddonRes
 * title: "ProductDetailAddonRes"
 * description: "Product detail addons"
 * x-resourceId: ProductDetailAddonRes
 * type: object
 * required:
 *    - id
 *    - name
 *    - children
 * properties:
 *    id:
 *     type: string
 *    price:
 *     type: number
 *    name:
 *     type: string
 *    children:
 *     type: array
 *     items:
 *      $ref: "#/components/schemas/ProductDetailAddonRes"
 */

export type ProductDetailAddonRes = {
  id: string
  name: string
  children: ProductDetailAddonRes[]
  rank: number
}

/**
 * @schema ProductDetailVariantRes
 * title: "ProductDetailVariantRes"
 * description: "Product detail variants"
 * x-resourceId: ProductDetailVariantRes
 * type: object
 * required:
 *    - id
 *    - inventory_quantity
 *    - price
 *    - sku
 * properties:
 *    id:
 *     type: string
 *    color:
 *     type: string
 *    size:
 *     type: string
 *    inventory_quantity:
 *     type: number
 *    price:
 *     type: number
 *    sku:
 *     type: string
 *    title:
 *     type: string
 *    manage_inventory:
 *     type: boolean
 *    prices:
 *     description: The Money Amounts defined for the Product Variant. Each Money Amount represents a price in a given currency or a price in a specific Region. Available if the relation `prices` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/money_amount"
 *    varaint_no:
 *     type: integer
 */
export type ProductDetailVariantRes = {
  id: string
  color?: string
  size?: string
  title?: string
  price: number
  inventory_quantity: number
  sku: string
  prices: MoneyAmount[]
  manage_inventory: boolean
  varaint_no?: number
}

/**
 * @schema ProductDetailShippingOptionAddonRes
 * title: "ProductDetailShippingOptionAddonRes"
 * description: "Product detail shipping options"
 * x-resourceId: ProductDetailShippingOptionAddonRes
 * type: object
 * required:
 *    - id
 *    - name
 *    - is_trackable
 *    - is_warranty
 * properties:
 *    id:
 *     type: string
 *    name:
 *     type: string
 *    bulk_added_price:
 *     type: number
 *    is_trackable:
 *     type: boolean
 *    is_warranty:
 *     type: boolean
 *    amount:
 *     type: number
 *    data:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 *    fulfillment:
 *     $ref: "#/components/schemas/fulfillment_provider"
 *    metadata:
 *     type: object
 */

export type ProductDetailShippingOptionRes = {
  id: string
  name: string
  bulk_added_price?: number
  is_trackable: boolean
  is_warranty: boolean
  amount: number | null
  data: Record<string, unknown>
  fulfillment: FulfillmentProvider
  metadata: any
}

/**
 * @schema ProductStoreDetailRes
 * title: "ProductStoreDetailRes"
 * description: "Product store detail"
 * x-resourceId: ProductStoreDetailRes
 * type: object
 * required:
 *    - id
 *    - company_name
 * properties:
 *    id:
 *     type: string
 *    company_name:
 *     type: string
 */
export type ProductStoreDetailRes = {
  id: string
  company_name: string
}

/**
 * @schema ProductStoreOwnerRes
 * title: "ProductStoreOwnerRes"
 * description: "Product store owner"
 * x-resourceId: ProductStoreOwnerRes
 * type: object
 * required:
 *    - id
 *    - nickname
 * properties:
 *    id:
 *     type: string
 *    nickname:
 *     type: string
 */
export type ProductStoreOwnerRes = {
  id: string
  nickname: string
}

export type ProductStoreRes = {
  id: string
  name: string
  store_detail: ProductStoreDetailRes
  owner: ProductStoreOwnerRes
  plan_type: StorePlanType
  is_return_guarantee: boolean
  status: StoreStatus
}

/**
 * @schema ProductMaterialRes
 * title: "ProductMaterialRes"
 * description: "Product material"
 * x-resourceId: ProductMaterialRes
 * type: object
 * required:
 *    - id
 *    - name
 * properties:
 *    id:
 *     type: string
 *    name:
 *     type: string
 */
export type ProductMaterialRes = {
  id: string
  name: string
}
/**
 * @schema ProductColorsRes
 * title: "ProductColorsRes"
 * description: "Product colors"
 * x-resourceId: ProductColorsRes
 * type: object
 * required:
 *    - color
 * properties:
 *    color:
 *      $ref: "#/components/schemas/product_color"
 */
export type ProductColorsRes = {
  color: ProductColor
}
export type ProductDetailRes = {
  id: string
  title: string
  created_at: Date
  updated_at: Date
  tags: ProductDetailTagRes[]
  images: ProductDetailImageRes[]
  addons: ProductDetailAddonRes[]
  variants: ProductDetailVariantRes[]
  like_cnt: number
  is_liked?: boolean
  shipping_options: ProductDetailShippingOptionRes[]
  description: string
  remarks: string
  is_customizable: boolean
  gift_cover: GiftCoverEnum
  store_id: string
  ship_after: string
  ship_from: string
  ship_from_id: string
  metadata: Record<string, unknown>
  type_id: string
  type_lv1_id: string
  type_lv2_id: string
  thumbnail: string
  store: ProductStoreRes
  material: ProductMaterialRes
  specs: ProductSpecs[]
  colors: ProductColorsRes[]
  is_free_shipping: boolean
  shipping_prefectures: Prefecture[]
}

export class GetProductDetailReq {
  @IsString()
  @IsOptional()
  tmp_user_id: string

  @IsString()
  @IsOptional()
  user_id?: string
}
