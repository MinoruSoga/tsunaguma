import { IsType } from '@medusajs/medusa/dist/utils/validators/is-type'
import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ProductSizeService } from '../../services/product-size.service'

/**
 * @oas [get] /product-sizes
 * operationId: "GetProductSizes"
 * summary: "List All Product Sizes"
 * description: "Retrieve a list of Product Sizes."
 * x-authenticated: false
 * parameters:
 *   - (query) fields {string} (Comma separated) Which fields should be included in each product_sizes of the result.
 *   - in: query
 *     name: product_type_id
 *     description: product_type to search for
 *     required: true
 *     schema:
 *       oneOf:
 *         - type: string
 *           description: a single product_type_id to search
 *         - type: array
 *           description: multiple product_type_id to search
 *           items:
 *             type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-size
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *            $ref: "#/components/schemas/product_size"
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
const productSizeListProductController = async (
  req: MedusaRequest,
  res: Response,
) => {
  const productSizeService = req.scope.resolve(
    'productSizeService',
  ) as ProductSizeService
  const specs = await productSizeService.listAll(
    req.filterableFields,
    req.retrieveConfig,
  )

  res.status(200).json(specs)
}
export default productSizeListProductController

export class GetProductSizeParams {
  @IsType([String, [String]])
  @IsOptional()
  product_type_id?: string | string[]

  @IsString()
  @IsOptional()
  fields?: string
}

export const defaultProductSizeFields = [
  'id',
  'product_type_id',
  'name',
  'unit',
  'desc',
  'is_free',
  'rank',
  'is_selectable',
  'image',
]
