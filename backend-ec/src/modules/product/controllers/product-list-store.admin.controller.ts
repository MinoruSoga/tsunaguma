import { PriceSelectionContext, Product } from '@medusajs/medusa'
import { PricingService } from '@medusajs/medusa/dist/services'
import { PricedProduct } from '@medusajs/medusa/dist/types/pricing'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import { ProductStatusEnum } from '../entity/product.entity'
import { ProductService } from '../services/product.service'

/**
 * @oas [get] /product-list-store
 * operationId: "GetProductListByStore"
 * summary: "list All Product of Store."
 * description: "Retrieve a list of Product by store_id."
 * x-authenticated: false
 * parameters:
 *   - (query) store_id=* {string} The parent_id of category.
 *   - (query) fields {string} (Comma separated) Which fields should be included in each products of the result.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
 *   - (query) order {string} The order of products
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each product of the result.
 *   - (query) sort {string} The sort of products
 *   - (query) excludes {string} Product Ids to be excluded
 *   - in: query
 *     name: status
 *     required: false
 *     schema:
 *       $ref: "#/components/schemas/ProductStatusEnum"
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

const productListByStoreController = async (
  req: MedusaRequest,
  res: Response,
) => {
  const tempPriceContext: PriceSelectionContext = {
    currency_code: JAPANESE_CURRENCY_CODE,
  }
  const productService = req.scope.resolve('productService') as ProductService

  const pricingService: PricingService = req.scope.resolve('pricingService')

  const [rawProducts, count] = await productService.listByStore(
    req.filterableFields as any,
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
export default productListByStoreController

export class GetProductbyStoreParams {
  @IsString()
  store_id: string

  @IsEnum(ProductStatusEnum, {
    always: true,
    message: `Invalid value (status must be one of following values: ${Object.values(
      ProductStatusEnum,
    ).join(', ')})`,
  })
  @IsOptional()
  status?: ProductStatusEnum

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
  excludes?: string
}

export const defaultProductByStoreFields = [
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
  'display_id',
  'display_code',
  'margin_rate',
  'spec_rate',
  'spec_starts_at',
  'spec_ends_at',
  'shop_rank',
]
