import { PriceSelectionContext, Product } from '@medusajs/medusa'
import { PricingService } from '@medusajs/medusa/dist/services'
import { PricedProduct } from '@medusajs/medusa/dist/types/pricing'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import {
  JAPANESE_CURRENCY_CODE,
  LOGGED_IN_USER_KEY,
} from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { ProductStatusEnum } from '../entity/product.entity'
import { ProductSearchCmsService } from '../services/product-search-cms.service'

/**
 * @oas [post] /list-product-cms
 * operationId: "GetProductListForCms"
 * summary: "list All Product of admin cms."
 * description: "Retrieve a list of Product for admin cms."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/GetProductCmsBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/product"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */

const productListCms = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const tempPriceContext: PriceSelectionContext = {
    currency_code: JAPANESE_CURRENCY_CODE,
  }

  const validated = await validator(GetProductCmsBody, req.body)

  const productSearchCmsService = req.scope.resolve(
    'productSearchCmsService',
  ) as ProductSearchCmsService

  const pricingService: PricingService = req.scope.resolve('pricingService')

  const [rawProducts, count] = await productSearchCmsService.listProducts(
    validated,
  )

  rawProducts.map((e) => {
    if (e.variants?.length) {
      e.variants = e.variants.filter((v) => !v.is_deleted)
    }
  })

  let products: (Product | PricedProduct)[] = rawProducts

  products = await pricingService.setProductPrices(
    rawProducts,
    tempPriceContext,
  )

  res.status(200).json({ products, count })
}
export default productListCms

/**
 * @schema GetProductCmsBody
 * title: "Get product list cms body"
 * description: "Get product list cms body"
 * x-resourceId: GetProductCmsBody
 * properties:
 *  ids:
 *    type: array
 *  display_code:
 *    type: string
 *  display_id:
 *    type: number
 *  title:
 *    type: string
 *  store_plan_type:
 *    type: array
 *    example: ["prime", "standard"]
 *  is_stock:
 *    type: array
 *    example: [true, false]
 *  is_maker_ship:
 *    type: array
 *    example: [true, false]
 *  created_from:
 *    type: string
 *    example: 2023-01-01 00:00:00
 *  created_to:
 *    type: string
 *    example: 2023-01-01 11:59:59
 *  updated_from:
 *    type: string
 *    example: 2023-01-01 00:00:00
 *  updated_to:
 *    type: string
 *    example: 2023-01-01 11:59:59
 *  released_from:
 *    type: string
 *    example: 2023-01-01 00:00:00
 *  released_to:
 *    type: string
 *    example: 2023-01-01 11:59:59
 *  store_name:
 *    type: string
 *  store_display_id:
 *    type: number
 *  type_lv1_id:
 *    type: string
 *  type_lv2_id:
 *    type: string
 *  type_id:
 *    type: string
 *  email:
 *    type: string
 *  url:
 *    type: string
 *  status:
 *     description: The status of the product
 *     type: string
 *     $ref: "#/components/schemas/ProductStatusEnum"
 *  limit:
 *    type: number
 *  offset:
 *    type: number
 */
export class GetProductCmsBody {
  @IsString()
  @IsOptional()
  display_code?: string

  @IsString()
  @IsOptional()
  title?: string

  @IsOptional()
  @IsNumber()
  display_id?: number

  @IsArray()
  @IsOptional()
  store_plan_type?: string[]

  @IsArray()
  @IsOptional()
  ids?: string[]

  @IsArray()
  @IsOptional()
  is_stock?: string[]

  @IsArray()
  @IsOptional()
  is_maker_ship?: string[]

  @IsString()
  @IsOptional()
  created_from?: string

  @IsString()
  @IsOptional()
  created_to?: string

  @IsString()
  @IsOptional()
  updated_from?: string

  @IsString()
  @IsOptional()
  updated_to?: string

  @IsString()
  @IsOptional()
  released_from?: string

  @IsString()
  @IsOptional()
  released_to?: string

  @IsString()
  @IsOptional()
  store_name?: string

  @IsNumber()
  @IsOptional()
  store_display_id?: number

  @IsString()
  @IsOptional()
  type_lv1_id?: string

  @IsString()
  @IsOptional()
  type_lv2_id?: string

  @IsString()
  @IsOptional()
  type_id?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  url?: string

  @IsEnum(ProductStatusEnum, {
    always: true,
    message: `Invalid value (status must be one of following values: ${Object.values(
      ProductStatusEnum,
    ).join(', ')})`,
  })
  @IsOptional()
  status?: ProductStatusEnum

  //paging
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}

export const defaultProductCmsFields = [
  'id',
  'title',
  'thumbnail',
  'type_id',
  'type_lv1_id',
  'type_lv2_id',
  'created_at',
  'status',
  'display_id',
  'display_code',
  'is_soldout',
]
