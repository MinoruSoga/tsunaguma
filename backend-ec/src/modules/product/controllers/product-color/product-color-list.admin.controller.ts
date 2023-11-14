import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ProductColorService } from '../../services/product-color.service'

/**
 * @oas [get] /product-colors
 * operationId: "GetProductColors"
 * summary: "list All Product Color"
 * description: "Retrieve a list of Product Colors."
 * x-authenticated: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-color
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *            $ref: "#/components/schemas/product_color"
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
const productColorController = async (req: MedusaRequest, res: Response) => {
  const productColorService = req.scope.resolve(
    'productColorService',
  ) as ProductColorService
  const productColors = await productColorService.listAll(
    req.filterableFields,
    req.retrieveConfig,
  )
  res.status(200).json(productColors)
}
export default productColorController

export class GetProductColorParams {
  @IsString()
  @IsOptional()
  fields?: string
}

export const defaultProductColorFields = ['id', 'name', 'code']
