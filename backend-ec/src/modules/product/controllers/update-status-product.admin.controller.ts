import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsArray, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ProductService } from '../services/product.service'

/**
 * @oas [put] /products/update-status
 * operationId: "UpdateStatusProducts"
 * summary: "Update product status"
 * description: "Update product status"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateStatusProductsReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
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

const updateStatusProducts = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const productService = req.scope.resolve('productService') as ProductService

  const validated = await validator(UpdateStatusProductsReq, req.body)
  await productService.updateStatus(validated.ids, validated.status)

  res.sendStatus(200)
}
export default updateStatusProducts

/**
 * @schema UpdateStatusProductsReq
 * title: "UpdateStatusProductsReq"
 * description: "Update Status Products Req"
 * x-resourceId: UpdateStatusProductsReq
 * type: object
 * required:
 *   - ids
 *   - status
 * properties:
 *  ids:
 *    type: array
 *    items:
 *      type: string
 *      description: id of product
 *  status:
 *    type: string
 *    description: status to update
 *    example: delete
 */
export class UpdateStatusProductsReq {
  @IsString()
  status: string

  @IsArray()
  ids: string[]
}
