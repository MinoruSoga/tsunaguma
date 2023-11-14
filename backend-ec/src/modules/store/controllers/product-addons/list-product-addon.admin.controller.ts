import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductAddonService } from '../../services/product-addon.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [get] /mystore/product-addon
 * operationId: "GetProductAddons"
 * summary: "List Product Addons"
 * description: "Retrieves a list of Product Addon"
 * x-authenticated: true
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
 *             type: array
 *             items:
 *               $ref: "#/components/schemas/ListProductAddonsRes"
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
const getAllProductAddonsController = async (
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
  const data = await productAddonService.list(loggedInUser.store_id)

  for (const item of data) {
    item.children.sort((a, b) => a.rank - b.rank)
  }

  res.json(data)
}

export default getAllProductAddonsController

/**
 * @schema ListProductAddonsRes
 * title: "ListProductAddonsRes"
 * description: "Response of product addon list"
 * x-resourceId: ListProductAddonsRes
 * required:
 *   - id
 *   - name
 *   - children
 * properties:
 *                  name:
 *                    type: string
 *                    description: name of the product addon
 *                  id:
 *                    type: string
 *                    description: id of the product addon
 *                  children:
 *                    type: array
 *                    items:
 *                      required:
 *                          - id
 *                          - name
 *                          - price
 *                      properties:
 *                        name:
 *                          type: string
 *                          description: name of the product addon
 *                        id:
 *                          type: string
 *                          description: id of the product addon
 *                        price:
 *                          type: number
 *                          description: price of the product addon
 */
