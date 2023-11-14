import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import { ProductSpecService } from '../../services/product-spec.service'

/**
 * @oas [delete] /product-spec/{id}
 * operationId: "DeleteProductSpec"
 * summary: "Delete Product Spec"
 * description: "Delete a list of Product Spec."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product spec.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-spec
 * responses:
 *   "200":
 *     description: OK
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
const deleteSpecController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const productSpecService = req.scope.resolve(
    'productSpecService',
  ) as ProductSpecService

  const id = req.params.id
  await productSpecService.delete(id)
  res.sendStatus(200)
}

export default deleteSpecController
