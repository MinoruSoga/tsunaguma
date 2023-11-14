import {
  defaultStoreCartFields,
  defaultStoreCartRelations,
} from '@medusajs/medusa'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { Cart } from '../entity/cart.entity'
import { CartService } from '../services/cart.service'

/**
 * @oas [post] /carts/{id}/sanitize
 * operationId: SanitizeCartItems
 * summary: Remove invalid cart items
 * description: "Remove invalid cart items."
 * parameters:
 *   - (path) id=* {string} The ID of the Cart.
 * tags:
 *   - Cart
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             cart:
 *               $ref: "#/components/schemas/cart"
 *             is_changed:
 *               type: boolean
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
  const cartId = req.params.id
  const cartService = req.scope.resolve<CartService>('cartService')
  const manager: EntityManager = req.scope.resolve('manager')

  let isChanged = false
  let cart: Cart = null

  await manager.transaction(async (transactionManager) => {
    isChanged = await cartService
      .withTransaction(transactionManager)
      .sanitizeItems(cartId)

    if (isChanged && cart?.payment_sessions?.length) {
      await cartService
        .withTransaction(transactionManager)
        .setPaymentSessions(cartId)
    }
  })

  if (isChanged) {
    cart = await cartService.retrieveWithTotals(cartId, {
      select: defaultStoreCartFields,
      relations: defaultStoreCartRelations,
    })
  }

  res.json({
    is_changed: isChanged,
    cart,
  })
}
