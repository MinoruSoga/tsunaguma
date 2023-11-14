import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductAddonService } from '../../services/product-addon.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [delete] /mystore/product-addon/{id}
 * operationId: "DeleteProductAddon"
 * summary: "Delete a product addon"
 * description: "Delete a product addon"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the product addon to delete.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   204:
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
const deleteProductAddonController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const productAddonService: ProductAddonService = req.scope.resolve(
    ProductAddonService.resolutionKey,
  )

  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const id = req.params.id

  await productAddonService.retrieve(loggedInUser.store_id, id, {
    select: ['id', 'store_id'],
  })

  await productAddonService.delete(id)
  res.sendStatus(204)
}

export default deleteProductAddonController
