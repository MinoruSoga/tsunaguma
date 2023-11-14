import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../user/constant'
import { DiscountHistoryService } from '../../services/discount-history.service'

/**
 * @oas [get] /discount/{id}/histories
 * operationId: "GetListDiscountHistory"
 * summary: "Get List Discount History"
 * description: "Get List Discount History"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of Discount
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of Discount
 * tags:
 *   - Discount
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
 *                  histories:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/discount_history"
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
const listDiscountHistoryController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const discountHistoryService: DiscountHistoryService = req.scope.resolve(
    'discountHistoryService',
  )
  const id = req.params.id
  const [histories, count] = await discountHistoryService.listHistory(
    id,
    req.listConfig,
  )

  res.status(200).json({ histories, count })
}

export default listDiscountHistoryController

export class GetListDiscountHistoryParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}
