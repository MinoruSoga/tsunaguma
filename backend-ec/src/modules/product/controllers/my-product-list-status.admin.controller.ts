import { PriceSelectionContext, Product } from '@medusajs/medusa'
import { PricingService } from '@medusajs/medusa/dist/services'
import { PricedProduct } from '@medusajs/medusa/dist/types/pricing'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import { ProductStatusEnum } from '../entity/product.entity'
import { ProductService } from '../services/product.service'

/**
 * @oas [get] /myproduct-list-status
 * operationId: "GetMyProductbyStatus"
 * summary: "Get My Product by Status"
 * description: "Get My Product by Status"
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: status
 *     required: true
 *     schema:
 *       $ref: "#/components/schemas/ProductStatusEnum"
 *   - (query) fields {string} (Comma separated) Which fields should be included in each products of the result.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
 *   - (query) order {string} The order of products
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each product of the result.
 *   - (query) title {string} Search product with title.
 *   - (query) sort {string} Sort product with stock_quantity.
 *   - (query) stock {string} Get product in stock.
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

const myProductListbyStatus = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve('loggedInUser') as LoggedInUser
  if (!loggedInUser || !loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const tempPriceContext: PriceSelectionContext = {
    currency_code: JAPANESE_CURRENCY_CODE,
  }

  const pricingService: PricingService = req.scope.resolve('pricingService')

  const productService = req.scope.resolve('productService') as ProductService

  const [rawProducts, count] = await productService.listByStatus(
    loggedInUser.store_id,
    req.filterableFields,
    req.listConfig,
  )

  rawProducts.map(async (e: Product) => {
    e = await productService.standardizedVariants(e)
    return e
  })

  let products: (Product | PricedProduct)[] = rawProducts

  products = await pricingService.setProductPrices(
    rawProducts,
    tempPriceContext,
  )

  res.status(200).json({ products, count })
}
export default myProductListbyStatus

export class MyProductsbyStatusParams {
  @IsEnum(ProductStatusEnum, {
    always: true,
    message: `Invalid value (status must be one of following values: ${Object.values(
      ProductStatusEnum,
    ).join(', ')})`,
  })
  status: ProductStatusEnum

  @IsString()
  @IsOptional()
  fields?: string

  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number

  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  expand?: string

  @IsString()
  @IsOptional()
  sort?: string

  @IsString()
  @IsOptional()
  stock?: string
}

export const defaultMyProductFields = [
  'id',
  'title',
  'subtitle',
  'description',
  'thumbnail',
  'profile_id',
  'material',
  'created_at',
  'remarks',
  'material_id',
  'like_cnt',
  'status',
]
