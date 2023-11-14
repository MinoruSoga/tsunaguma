import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { CartService } from '../services/cart.service'

/**
 * @oas [get] /carts/{id}/free-shipping/{store_id}
 * operationId: GetStoreFreeShippingLeft
 * summary: Get free shipping left of a cart based on a store.
 * description: "Get free shipping left of a cart based on a store."
 * parameters:
 *   - (path) id=* {string} The id of the Cart.
 *   - (path) store_id=* {string} The id of the store.
 * tags:
 *   - Cart
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           required:
 *             - store_total
 *             - amount_to_free
 *           properties:
 *             cart_total:
 *               type: number
 *             store_total:
 *               type: number
 *             amount_to_free:
 *               type: number
 *             free_ship_amount:
 *               type: number
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
export default async function (req: MedusaRequest, res: Response) {
  const { id, store_id } = req.params
  const cartService = req.scope.resolve('cartService') as CartService

  const result = await cartService.getStoreFreeShippingLeft(id, store_id)
  res.json(result)
}
