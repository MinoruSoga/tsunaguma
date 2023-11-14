import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { LineItemService } from '../services/line-item.service'

/**
 * @oas [delete] /line-item/{id}
 * operationId: "DeleteLineItemInOrder"
 * summary: "Delete a line item in order"
 * description: "Delete a line item in order"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the LineItems.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Line-items
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
const deleteLineItemsCms = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const { id } = req.params
  const lineItemService: LineItemService = req.scope.resolve('lineItemService')

  await lineItemService.delete(id)

  res.sendStatus(200)
}

export default deleteLineItemsCms
