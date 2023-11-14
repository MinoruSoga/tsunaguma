import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsNotEmpty } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { TransferType } from '../../entity/store_billing.entity'
import StoreService from '../../services/store.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [put] /mystore/billing/transfer-type
 * operationId: "PutStoreBillingTransferType"
 * summary: "update store billing transfer type"
 * description: "update store billing transfer type."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateBillingTransferTypeReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Profile
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/storeBilling"
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
 *
 */
const updateStoreBillingTransferTypeController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const validated = await validator(UpdateBillingTransferTypeReq, req.body)
  const type = <TransferType>validated.type
  const storeService: StoreService = req.scope.resolve('storeService')
  const store = await storeService.updateStoreBillingTransferType(
    loggedInUser.id,
    type,
  )

  res.status(200).json(store)
}
export default updateStoreBillingTransferTypeController

/**
 * @schema UpdateBillingTransferTypeReq
 * title: "UpdateBillingTransferTypeReq"
 * description: "Update store billing transfer type request"
 * x-resourceId: UpdateBillingTransferTypeReq
 * type: object
 * required:
 *   - type
 * properties:
 *  type:
 *    type: string
 *    enum: [manual, auto]
 *    description: Type of billing transfer
 *    example: string
 */
export class UpdateBillingTransferTypeReq {
  @IsNotEmpty()
  @IsEnum(TransferType, { each: true })
  type: string
}
