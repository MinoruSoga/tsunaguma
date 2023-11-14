import { defaultAdminProductRelations, MoneyAmount } from '@medusajs/medusa'
import { Selector } from '@medusajs/medusa/dist/types/common'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { In, Not } from 'typeorm'

import {
  JAPANESE_CURRENCY_CODE,
  LOGGED_IN_USER_KEY,
} from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { notAllowedGetMyProductStatuses } from '../constant'
import { GiftCoverEnum, Product } from '../entity/product.entity'
import { ProductColor } from '../entity/product-color.entity'
import { ProductSpecs } from '../entity/product-specs.entity'
import { PriceListService } from '../services/price-list.service'
import { ProductService } from '../services/product.service'

/**
 * @oas [get] /products/{id}/cms
 * operationId: "GetProductDetailCms"
 * summary: "Get a Product Admin Cms"
 * description: "Retrieves a Product."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product.
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
 *               $ref: "#/components/schemas/ProductDetailCmsRes"
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
function orderByRank<T extends { rank: number }>(a: T, b: T) {
  return a.rank - b.rank
}

export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const { id } = req.params

  const productService: ProductService = req.scope.resolve('productService')
  const priceListService: PriceListService =
    req.scope.resolve('priceListService')

  req.retrieveConfig = req.retrieveConfig ?? {}

  const relations =
    req.retrieveConfig.relations ||
    defaultAdminProductRelations.concat([
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

  const product = (await productService.retrieve_(
    {
      id,
      status: Not(In(notAllowedGetMyProductStatuses)),
    } as Selector<Product>,
    {
      currency_code: JAPANESE_CURRENCY_CODE,
      relations,
    },
  )) as Product

  // temp filter deleted variants
  if (product.variants?.length) {
    product.variants = product.variants.filter((v) => !v.is_deleted)
  }

  // add priceList
  const priceListId = product?.variants[0]?.prices?.filter(
    (price) => !!price.price_list_id,
  )[0]?.price_list_id
  if (priceListId) {
    const priceList = await priceListService.retrieve_(priceListId)
    if (priceList) {
      product.variants.forEach((variant) => {
        variant.prices.forEach((price) => {
          if (!!price.price_list_id) {
            price.price_list = priceList
          }
        })
      })
    }
  }

  // sort by rank
  if (product.product_images?.length) {
    product.product_images = product.product_images.sort(orderByRank)
    product.images = product.product_images.map(({ image }) => image)
  }
  if (product.product_specs?.length) {
    product.product_specs = product.product_specs.sort(orderByRank)
  }
  if (product.product_addons?.length) {
    product.product_addons = product.product_addons.sort(orderByRank)
  }
  if (product.product_colors?.length) {
    product.product_colors = product.product_colors.sort(orderByRank)
  }
  if (product.product_shipping_options?.length) {
    product.product_shipping_options =
      product.product_shipping_options.sort(orderByRank)
  }

  const convertedProduct = await productService.convertProductDetailCms(product)

  res.json(convertedProduct)
}

type ProductDetailTagRes = {
  id: string
  value: string
}

type ProductDetailImageRes = {
  id: string
  url: string
}

export type ProductDetailAddonRes = {
  id: string
  name: string
  children: ProductDetailAddonRes[]
}

export type ProductDetailVariantRes = {
  id: string
  color?: string
  size?: string
  title?: string
  price: number
  inventory_quantity: number
  sku: string
  prices: MoneyAmount[]
  varaint_no?: number
}

export type ProductDetailShippingOptionRes = {
  id: string
  name: string
  bulk_added_price?: number
  is_trackable: boolean
  is_warranty: boolean
  amount: number | null
  data: Record<string, unknown>
}

export type ProductStoreDetailRes = {
  id: string
  company_name: string
}

export type ProductStoreOwnerRes = {
  id: string
  nickname: string
}

/**
 * @schema ProductStoreRes
 * title: "ProductStoreRes"
 * description: "Product store"
 * x-resourceId: ProductStoreRes
 * type: object
 * required:
 *    - id
 *    - name
 *    - store_detail
 *    - owner
 *    - display_id
 *    - plan_type
 *    - is_return_guarantee
 *    - status
 * properties:
 *    id:
 *     type: string
 *    name:
 *     type: string
 *    store_detail:
 *     type: object
 *     items:
 *       $ref: "#/components/schemas/ProductStoreDetailRes"
 *    owner:
 *     type: object
 *     items:
 *       $ref: "#/components/schemas/ProductStoreDetailRes"
 *    display_id:
 *     type: number
 *    plan_type:
 *     type: string
 *    is_return_guarantee:
 *     type: boolean
 *    status:
 *     $ref: "#/components/schemas/StoreStatusEnum"
 */
export type ProductStoreRes = {
  id: string
  name: string
  store_detail: ProductStoreDetailRes
  owner: ProductStoreOwnerRes
  customer: ProductCustomerRes
  display_id: number
  is_return_guarantee?: boolean
}

/**
 * @schema ProductCustomerRes
 * title: "ProductCustomerRes"
 * description: "Product customer"
 * x-resourceId: ProductCustomerRes
 * type: object
 * required:
 *    - display_id
 * properties:
 *    display_id:
 *     type: number
 */
export type ProductCustomerRes = {
  display_id: number
}

export type ProductMaterialRes = {
  id: string
  name: string
}

export type ProductColorsRes = {
  color: ProductColor
}

/**
 * @schema ProductDetailCmsRes
 * title: "ProductDetailCmsRes"
 * description: "Get product detail cms"
 * x-resourceId: ProductDetailCmsRes
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
 *       description: ship from pref's name
 *     ship_from_id:
 *       type: string
 *       description: ship from pref's id
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
 *     margin_rate:
 *       type: number
 *     spec_rate:
 *       type: number
 *     spec_starts_at:
 *       type: string
 *       description: "The date with timezone at which the resource was created."
 *       format: date-time
 *     spec_ends_at:
 *       type: string
 *       description: "The date with timezone at which the resource was created."
 *       format: date-time
 *     display_code:
 *       type: string
 *     display_id:
 *       type: number
 *     is_return_guarantee:
 *       type: boolean
 */
export type ProductDetailCmsRes = {
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
  margin_rate: number
  spec_rate: number
  spec_starts_at: Date
  spec_ends_at: Date
  display_id: number
  display_code: string
  is_return_guarantee: boolean
}
