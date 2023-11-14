import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import { ProductTypeService } from '../../services/product-type.service'

/**
 * @oas [delete] /product-type/{id}
 * operationId: "DeleteProductType"
 * summary: "Delete Product Type"
 * description: "Delete a list of Product Type."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product type.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-type
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
const deleteCategoryController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const productTypeService = req.scope.resolve(
    'productTypeService',
  ) as ProductTypeService

  const id = req.params.id
  await productTypeService.delete(id)
  res.sendStatus(200)
}

export default deleteCategoryController
