import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsNumber, IsObject, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { TransferType } from '../../entity/store_billing.entity'
import StoreService from '../../services/store.service'

/**
 * @oas [post] /mystore/billing
 * operationId: "CreateStoreBilling"
 * summary: "create store billing"
 * description: "create store billing."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/CreateStoreBillingReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
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
const createdStoreBillingController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }
  const validated = await validator(CreateStoreBillingReq, req.body)
  const storeService: StoreService = req.scope.resolve('storeService')
  const store = await storeService.createdStoreBilling(
    loggedInUser.store_id,
    validated,
  )
  res.status(200).json(store)
}
export default createdStoreBillingController

/**
 * @schema CreateStoreBillingReq
 * title: "Create store billing body"
 * description: "Create store billing body"
 * x-resourceId: CreateStoreBillingReq
 * required:
 *  - transfer_type
 * properties:
 *   transfer_type:
 *     description: "Transfer type"
 *     type: string
 *     enum: [manual, auto]
 *   total_origin_price:
 *     description: "total origin price"
 *     type: integer
 *     example: 100
 *   total_delivery_price:
 *     description: "total delivery price"
 *     type: integer
 *     example: 100
 *   total_discount_coupon:
 *     description: "total discount coupon"
 *     type: integer
 *     example: 100
 *   total_fee:
 *     description: "total fee"
 *     type: integer
 *     example: 100
 *   total_discount_campaign:
 *     description: "total discount campaign"
 *     type: integer
 *     example: 100
 *   total_discount_promotion:
 *     description: "total discount promotion"
 *     type: integer
 *     example: 100
 *   total_coupon_used:
 *     description: "total coupon used"
 *     type: integer
 *     example: 2
 *   total_price:
 *     description: "total price"
 *     type: integer
 *     example: 500
 *   tax_price:
 *     description: "total price"
 *     type: integer
 *     example: 50
 *   metadata:
 *     $ref: '#/components/schemas/metaDataType'
 */
export class CreateStoreBillingReq {
  @IsEnum(TransferType, {
    always: true,
    message: `Invalid value (gender must be one of following values: [${Object.values(
      TransferType,
    ).join(',')}])`,
  })
  transfer_type?: TransferType

  @IsNumber()
  @IsOptional()
  total_origin_price?: number

  @IsNumber()
  @IsOptional()
  total_delivery_price?: number

  @IsNumber()
  @IsOptional()
  total_discount_coupon?: number

  @IsNumber()
  @IsOptional()
  total_fee?: number

  @IsNumber()
  @IsOptional()
  total_discount_campaign?: number

  @IsNumber()
  @IsOptional()
  total_discount_promotion?: number

  @IsNumber()
  @IsOptional()
  total_coupon_used?: number

  @IsNumber()
  @IsOptional()
  total_price?: number

  @IsNumber()
  @IsOptional()
  tax_price?: number

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}
