import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ProductAddonService } from '../../services/product-addon.service'

/**
 * @oas [get] /mystore/product-addon/{id}/cms
 * operationId: "GetProductAddonsStore"
 * summary: "List Product Addons"
 * description: "Retrieves a list of Product Addon"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Store.
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
 *               $ref: "#/components/schemas/ListProductAddonsStoreRes"
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
const getProductAddonsStore = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const productAddonService: ProductAddonService = req.scope.resolve(
    ProductAddonService.resolutionKey,
  )
  const { id } = req.params
  const data = await productAddonService.listByStore(id)
  res.json(data)
}

export default getProductAddonsStore

/**
 * @schema ListProductAddonsStoreRes
 * title: "ListProductAddonsStoreRes"
 * description: "Response of product addon list by store"
 * x-resourceId: ListProductAddonsStoreRes
 * required:
 *   - id
 *   - name
 *   - children
 * properties:
 *  name:
 *    type: string
 *    description: name of the product addon
 *  id:
 *    type: string
 *    description: id of the product addon
 *  children:
 *    type: array
 *    items:
 *      required:
 *          - id
 *          - name
 *          - price
 *      properties:
 *        name:
 *          type: string
 *          description: name of the product addon
 *        id:
 *          type: string
 *          description: id of the product addon
 *        price:
 *          type: number
 *          description: price of the product addon
 */
