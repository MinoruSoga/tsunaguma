import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ProductService } from '../../services/product.service'

/**
 * @oas [get] /product-addons/{id}
 * operationId: "GetAddonsOfProduct"
 * summary: "Get list addons of product"
 * description: "Get list addons of product"
 * x-authenticated: false
 * parameters:
 *   - (path) id=* {string} The ID of the Producrt.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *              $ref: "#/components/schemas/ProductListAddonItemRes"
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
const getProductOptionsList = async (req: MedusaRequest, res: Response) => {
  const { id } = req.params
  const productService: ProductService = req.scope.resolve('productService')

  const addons = await productService.listAddons(id)

  res.json(addons)
}

/**
 * @schema ProductListAddonItemRes
 * title: "ProductListAddonItemRes"
 * description: "A product addon"
 * x-resourceId: ProductListAddonItemRes
 * type: object
 * required:
 *  - id
 *  - name
 *  - children
 * properties:
 *     id:
 *       description: "Parent product addon id"
 *       type: string
 *       example: prod_addon_332rdlsalfaaaa
 *     name:
 *       description: "Product addon name"
 *       type: string
 *       example: 長い
 *     children:
 *       type: array
 *       items:
 *         type: object
 *         required:
 *           - id
 *           - name
 *           - price
 *         properties:
 *           id:
 *            type: string
 *           name:
 *            type: string
 *           price:
 *            type: number
 */

export default getProductOptionsList
