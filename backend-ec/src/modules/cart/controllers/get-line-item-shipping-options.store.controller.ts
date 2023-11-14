import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { CartService } from '../services/cart.service'
import { LineItemService } from '../services/line-item.service'

/**
 * @oas [get] /carts/{id}/line-items/{line_id}/shipping-options
 * operationId: GetLineItemShippingOptions
 * summary: Get a Line Item's Shipping Options
 * parameters:
 *   - (path) id=* {string} The id of the Cart.
 *   - (path) line_id=* {string} The id of the Line Item.
 * tags:
 *   - LineItem
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *          type: array
 *          items:
 *            $ref: "#/components/schemas/product_shipping_options"
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
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const { id, line_id } = req.params
  const cartService: CartService = req.scope.resolve('cartService')
  const lineItemService: LineItemService = req.scope.resolve('lineItemService')

  const cart = await cartService.retrieve(id, { relations: ['items'] })

  const existing = cart.items.find((i) => i.id === line_id)
  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Could not find the line item',
    )
  }

  const shippingOptions = await lineItemService.getShippingOptions(line_id)

  res.json(shippingOptions)
}
