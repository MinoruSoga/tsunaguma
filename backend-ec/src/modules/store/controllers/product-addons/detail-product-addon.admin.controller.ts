import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductAddonService } from '../../services/product-addon.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [get] /mystore/product-addon/{id}
 * operationId: "GetProductAddonDetail"
 * summary: "Get a product addon"
 * description: "Retrieves a product addon in detail."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product Addon.
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
 *             $ref: "#/components/schemas/product_addon"
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
const getProductAddonDetailController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const productAddonService: ProductAddonService = req.scope.resolve(
    ProductAddonService.resolutionKey,
  )
  const id = req.params.id
  const productAddon = await productAddonService.retrieve(
    loggedInUser.store_id,
    id,
    {
      relations: ['children'],
    },
  )

  productAddon.children.sort((a, b) => a.rank - b.rank)

  res.json(productAddon)
}

export default getProductAddonDetailController
