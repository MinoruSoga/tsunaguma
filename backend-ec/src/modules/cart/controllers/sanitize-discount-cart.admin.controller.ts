import {
  defaultStoreCartFields,
  defaultStoreCartRelations,
} from '@medusajs/medusa'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { Cart } from '../entity/cart.entity'
import { CartService } from '../services/cart.service'
import { UpsertCartDiscountReq } from './upsert-cart-discount.admin.controller'

/**
 * @oas [post] /carts/{id}/sanitize/discount
 * operationId: SanitizeDiscountCart
 * summary: Remove invalid discount cart items
 * description: "Remove invalid discount cart items."
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

  let change: UpsertCartDiscountReq = {
    used_point: 0,
    promo_code_id: undefined,
    coupon_id: undefined,
  }
  let cart: Cart = null

  await manager.transaction(async (tm) => {
    cart = (await cartService
      .withTransaction(tm)
      .retrieveWithTotals(cartId)) as Cart

    change = await cartService.withTransaction(tm).sanitizeDiscounts(cart)
    await cartService
      .withTransaction(tm)
      .upsertCartDiscount(req.params.id, change)

    if (cart?.payment_sessions?.length) {
      await cartService.withTransaction(tm).setPaymentSessions(cartId)
    }
  })

  cart = await cartService.retrieveWithTotals(cartId, {
    select: defaultStoreCartFields,
    relations: defaultStoreCartRelations,
  })

  res.status(200).json({
    cart,
  })
}
