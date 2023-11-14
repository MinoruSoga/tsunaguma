import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ProductService } from '../services/product.service'

/**
 * @oas [get] /product/{id}/category
 * operationId: GetTotalProductFollowStore
 * summary: Get total product follow Store
 * x-authenticated: false
 * parameters:
 *   - (path) id=* {string} The store's ID.
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             result:
 *               type: array
 *               items:
 *                 type: object
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

const getTotalProductCategory = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const productService: ProductService = req.scope.resolve('productService')

  const { id } = req.params

  const result = await productService.getTotalProductCategory(id)

  res.status(200).json({ result })
}
export default getTotalProductCategory
