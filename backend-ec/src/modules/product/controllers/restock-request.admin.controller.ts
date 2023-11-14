import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString, MaxLength } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { RestockRequestService } from '../services/restock-request.service'
/**
 * @oas [post] /product/restock-request
 * operationId: ProductVariantRestockRequest
 * summary: "Product Variant Restock Request"
 * description: "Product Variant Restock Request"
 * requestBody:
 *   description: Params to restock request
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/RestockRequestBody"
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             user:
 *               $ref: "#/components/schemas/customer"
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

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const restockRequestService = req.scope.resolve<RestockRequestService>(
    RestockRequestService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const data = await validator(RestockRequestBody, req.body)

  const product = await restockRequestService.createRestockRequest(
    data,
    loggedInUser?.id,
  )

  res.send(product)
}

/**
 * @schema RestockRequestBody
 * title: "RestockRequestBody"
 * description: "Restock request for variant product"
 * x-resourceId: RestockRequestBody
 * type: object
 * required:
 *   - variant_id
 *   - product_id
 * properties:
 *   variant_id:
 *     description: "variant id"
 *     type: string
 *   product_id:
 *     description: "product id"
 *     type: string
 *   content:
 *     description: "content"
 *     type: string
 *     maxLength: 150
 */

export class RestockRequestBody {
  @IsString()
  product_id: string

  @IsString()
  variant_id: string

  @IsString()
  @MaxLength(150)
  content: string
}
