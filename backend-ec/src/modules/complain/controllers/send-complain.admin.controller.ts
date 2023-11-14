import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ComplainService } from '../services/complain.service'

/**
 * @oas [post] /complain/product
 * operationId: "SendComplainProduct"
 * summary: "Send complain product"
 * description: "Send complain product"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/ComplainRegisterReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Complain
 * responses:
 *   201:
 *     description: Created
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
export default async (req: MedusaRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const complainService = req.scope.resolve(
    'complainService',
  ) as ComplainService
  const validated = await validator(ComplainRegisterReq, req.body)
  const data = { ..._.omit(validated) }
  await complainService.create(
    data.product_id,
    data.reason,
    data.reasonType,
    loggedInUser.id,
  )

  res.sendStatus(201)
}

/**
 * @schema ComplainRegisterReq
 * title: "ComplainRegisterReq"
 * description: "Complain register request"
 * x-resourceId: ComplainRegisterReq
 * type: object
 * required:
 *   - reason
 *   - reasonType
 *   - product_id
 * properties:
 *  reason:
 *    type: string
 *    description: reason
 *    example: reason
 *    maxLength: 1000
 *  reasonType:
 *    type: string
 *    description: reason type
 *  product_id:
 *    type: string
 *    description: id for products
 *    example: pro_1123
 */
export class ComplainRegisterReq {
  @IsString()
  @MaxLength(1000)
  @IsNotEmpty()
  reason: string

  @IsString()
  reasonType: string

  @IsString()
  @IsNotEmpty()
  product_id: string
}
