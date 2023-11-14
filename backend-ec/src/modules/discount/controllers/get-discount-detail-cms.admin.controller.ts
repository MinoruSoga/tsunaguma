import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { DiscountService } from '../services/discount.service'

/**
 * @oas [get] /discount/{id}/cms
 * operationId: "GetDiscountDetailCms"
 * summary: "get discount detail cms"
 * description: "get discount detail cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Discount.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Discount
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: object
 *          $ref: "#/components/schemas/discount"
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

const getDiscountDetailCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const discountService: DiscountService = req.scope.resolve(
    DiscountService.resolutionKey,
  )
  const discountId = req.params.id
  const discount = await discountService.getDiscount(discountId, [
    'rule.conditions.products',
    'rule.conditions.customer_groups',
    'rule.conditions.customer_groups.customers',
  ])

  res.status(200).json(discount)
}

export default getDiscountDetailCmsController
