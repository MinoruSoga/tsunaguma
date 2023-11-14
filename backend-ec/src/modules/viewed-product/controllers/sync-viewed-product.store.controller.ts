import { BaseEntity } from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNotEmpty, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ViewedProductService } from '../viewed-product.service'
/**
 * @oas [put] /viewed-products/sync
 * operationId: "SyncViewedProducts"
 * summary: "Sync rencently viewed products"
 * description: "Sync rencently viewed products"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/SyncViewedProductReq"
 * x-authenticated: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: ok
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
const syncViewedProductController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const viewedProductService = req.scope.resolve(
    'viewedProductService',
  ) as ViewedProductService

  const validated: SyncViewedProductReq = await validator(
    SyncViewedProductReq,
    req.body,
  )

  const userId = req.user?.id ?? req.user?.customer_id

  await viewedProductService.syncViewedProducts(validated, userId)

  res.status(200).send('synced')
}

/**
 * @schema SyncViewedProductReq
 * title: "SyncViewedProductReq"
 * description: "Sync Viewed Product Req"
 * x-resourceId: SyncViewedProductReq
 * type: object
 * required:
 *   - tmp_user_id
 * properties:
 *   tmp_user_id:
 *     description: "Uuid"
 *     type: string
 *     example: tusr_01GK6HJ9SX0VE59ZZATQCXACT2
 */
export class SyncViewedProductReq extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  tmp_user_id: string
}
export default syncViewedProductController
