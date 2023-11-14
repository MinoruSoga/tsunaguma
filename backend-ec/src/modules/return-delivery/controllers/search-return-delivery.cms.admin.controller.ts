import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import {
  ReturnDeliveryOriginEnum,
  ReturnDeliveryStatus,
} from '../entities/return-delivery.entity'
import { ReturnDeliverySearchService } from '../service/return-delivery-search.service'

/**
 * @oas [post] /return-delivery/search
 * operationId: "SearchReturnDeliveryCms"
 * summary: "Search return delivery cms"
 * description: "Search return delivery cms"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/GetListReturnCmsBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ReturnDelivery
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  count:
 *                    type: integer
 *                  return_deliveries:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/return_delivery"
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
const searchReturnDeliveryCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const returnDeliverySearchService: ReturnDeliverySearchService =
    req.scope.resolve(ReturnDeliverySearchService.resolutionKey)

  const validated = await validator(SearchReturnDeliveriesBody, req.body)

  const [returnsDeliveries, count] = await returnDeliverySearchService.search(
    validated,
  )

  res.status(200).json({ return_deliveries: returnsDeliveries, count })
}

/**
 * @schema SearchReturnDeliveriesBody
 * title: "Search return deliveries cms body"
 * description: "Search return deliveries body"
 * x-resourceId: SearchReturnDeliveriesBody
 * properties:
 *  limit:
 *    type: number
 *  offset:
 *    type: number
 *  display_id:
 *    type: number
 *  create_from:
 *    type: string
 *  create_to:
 *    type: string
 *  ship_from:
 *    type: string
 *  ship_to:
 *    type: string
 *  store_id:
 *    type: number
 *  store_name:
 *    type: string
 *  customer_id:
 *    type: number
 *  nickname:
 *    type: string
 *  status:
 *    $ref: "#/components/schemas/ReturnDeliveryStatus"
 *  product_code:
 *    type: string
 *  product_id:
 *    type: number
 *  product_name:
 *    type: string
 *  sku:
 *    type: string
 *  origin:
 *    $ref: "#/components/schemas/ReturnDeliveryOriginEnum"
 */

export class SearchReturnDeliveriesBody {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number

  @IsNumber()
  @IsOptional()
  display_id: number

  @IsString()
  @IsOptional()
  create_from?: string

  @IsString()
  @IsOptional()
  create_to?: string

  @IsString()
  @IsOptional()
  ship_from?: string

  @IsString()
  @IsOptional()
  ship_to?: string

  @IsNumber()
  @IsOptional()
  store_id: number

  @IsString()
  @IsOptional()
  store_name: string

  @IsNumber()
  @IsOptional()
  customer_id: number

  @IsString()
  @IsOptional()
  nickname: string

  @IsEnum(ReturnDeliveryStatus)
  @IsOptional()
  status: ReturnDeliveryStatus

  @IsString()
  @IsOptional()
  product_code: string

  @IsNumber()
  @IsOptional()
  product_id: number

  @IsString()
  @IsOptional()
  product_name: string

  @IsString()
  @IsOptional()
  sku: string

  @IsEnum(ReturnDeliveryOriginEnum)
  @IsOptional()
  origin: ReturnDeliveryOriginEnum
}
export default searchReturnDeliveryCmsController
