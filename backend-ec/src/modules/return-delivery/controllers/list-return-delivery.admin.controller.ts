import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { UserType } from '../../user/entity/user.entity'
import { ReturnDeliveryService } from '../service/return-delivery.service'

/**
 * @oas [get] /return-deliveries
 * operationId: GetListReturnDelivery
 * summary: Get list return delivery
 * parameters:
 *   - (query) fields {string} (Comma separated) Which fields should be included in each items of the result.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of items
 *   - (query) order {string} The order of items
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each items of the result.
 * tags:
 *   - ReturnDelivery
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             return_deliveries:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/return_delivery"
 *             count:
 *               type: integer
 *               description: The total number of items available
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
const getListReturnDelivery = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const returnDeliveryService = req.scope.resolve<ReturnDeliveryService>(
    ReturnDeliveryService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)

  if (
    !loggedInUser ||
    !loggedInUser.store_id ||
    !(loggedInUser.type === UserType.STORE_PRIME)
  ) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not store prime')
  }
  const [returnDeliveries, count] = await returnDeliveryService.list_(
    loggedInUser.store_id,
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ return_deliveries: returnDeliveries, count })
}
export default getListReturnDelivery

export class GetReturnDeliveriesParams {
  @IsString()
  @IsOptional()
  fields?: string

  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number

  @IsString()
  @IsOptional()
  expand?: string
}
