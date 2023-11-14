import { IsType } from '@medusajs/medusa/dist/utils/validators/is-type'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ProductSpecService } from '../../services/product-spec.service'

/**
 * @oas [get] /product-specs
 * operationId: "GetProductSpecs"
 * summary: "List All Product Specs"
 * description: "Retrieve a list of Product Specs"
 * x-authenticated: false
 * parameters:
 *   - (query) deep=3 {integer} The deep of childrens
 *   - (query) fields {string} (Comma separated) Which fields should be included in each product_specs of the result.
 *   - (query) parent_id {string} The parent_id of product-specs.
 *   - in: query
 *     name: product_type_id
 *     required: false
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
 *   - Product-spec
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *              $ref: "#/components/schemas/product_spec"
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

const productSpecController = async (req: MedusaRequest, res: Response) => {
  const productSpecService = req.scope.resolve(
    'productSpecService',
  ) as ProductSpecService
  const specs = await productSpecService.listAll(
    req.filterableFields,
    req.retrieveConfig,
  )
  res.status(200).json(specs)
}
export default productSpecController

export class GetProductSpecsParams {
  @IsString()
  @IsOptional()
  parent_id?: string

  @IsType([String, [String]])
  @IsOptional()
  product_type_id?: string | string[]

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(3)
  @IsOptional()
  deep?: number

  @IsString()
  @IsOptional()
  fields?: string
}

export const defaultProductSpecFields = [
  'id',
  'name',
  'is_free',
  'product_type_id',
  'parent_id',
]
