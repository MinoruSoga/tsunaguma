import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ProductTypeService } from '../../services/product-type.service'

/**
 * @oas [get] /product-types
 * operationId: "GetProductTypes"
 * summary: "List All Product Types"
 * description: "Retrieve a list of Product Types with childrens."
 * x-authenticated: false
 * parameters:
 *   - (query) parent_id {string} The parent_id of category.
 *   - (query) deep=3 {integer} The deep of childrens
 *   - (query) fields {string} (Comma separated) Which fields should be included in each product_types of the result.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-type
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *              $ref: "#/components/schemas/product_type"
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
const categoryProductController = async (req: MedusaRequest, res: Response) => {
  const productTypeService = req.scope.resolve(
    'productTypeService',
  ) as ProductTypeService
  const types = await productTypeService.listAll(
    req.filterableFields,
    req.retrieveConfig,
  )
  res.status(200).json(types)
}

export default categoryProductController

export class GetProductTypeParams {
  @IsString()
  @IsOptional()
  parent_id?: string

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

export const defaultProductTypeFields = ['id', 'value', 'parent_id', 'rank']
