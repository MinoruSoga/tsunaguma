import { IsType } from '@medusajs/medusa/dist/utils/validators/is-type'
import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ProductMaterialService } from '../../services/product-material.service'

/**
 * @oas [get] /product-materials
 * operationId: "GetProductMaterials"
 * summary: "list All Product Materials."
 * description: "Retrieve a list of Product Materials."
 * x-authenticated: false
 * parameters:
 *   - in: query
 *     name: product_type_id
 *     description: product_material to search for
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
 *   - Product-material
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *              $ref: "#/components/schemas/product_material"
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

const productMaterialListController = async (
  req: MedusaRequest,
  res: Response,
) => {
  const productMaterialService = req.scope.resolve(
    'productMaterialService',
  ) as ProductMaterialService
  const materials = await productMaterialService.listAll(
    req.filterableFields,
    req.retrieveConfig,
  )
  res.status(200).json(materials)
}
export default productMaterialListController

export class GetProductMaterialParams {
  @IsOptional()
  @IsType([String, [String]])
  product_type_id?: string | string[]

  @IsString()
  @IsOptional()
  fields?: string
}

export const defaultProductMaterialFields = ['id', 'name', 'product_type_id']
