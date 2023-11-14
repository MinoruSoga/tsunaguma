import {
  defaultStoreCartFields,
  defaultStoreCartRelations,
} from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { CartService } from '../services/cart.service'

/**
 * @oas [post] /carts/{id}/discount
 * operationId: UpdateCartDiscount
 * summary: Update a Cart Discount
 * description: "Updates a Cart Discount."
 * parameters:
 *   - (path) id=* {string} The id of the Cart.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         properties:
 *           used_point:
 *             type: number
 *             description: The point count the cart is going to use.
 *           promo_code_id:
 *             type: string
 *             description: The promotion code id
 *           coupon_id:
 *             type: string
 *             description: The coupon id
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
export default async (req: MedusaRequest, res: Response) => {
  const validated = await validator(UpsertCartDiscountReq, req.body)
  const cartService = req.scope.resolve('cartService') as CartService
  const manager: EntityManager = req.scope.resolve('manager')

  const cartId = req.params.id

  await manager.transaction(async (transactionManager) => {
    await cartService
      .withTransaction(transactionManager)
      .upsertCartDiscount(req.params.id, validated)

    const updated = await cartService
      .withTransaction(transactionManager)
      .retrieve(cartId, {
        relations: ['payment_sessions', 'shipping_methods'],
      })

    if (updated.payment_sessions?.length) {
      await cartService
        .withTransaction(transactionManager)
        .setPaymentSessions(cartId)
    }
  })

  const data = await cartService.retrieveWithTotals(cartId, {
    select: defaultStoreCartFields,
    relations: defaultStoreCartRelations,
  })
  res.json({ cart: data })
}

export class UpsertCartDiscountReq {
  @IsOptional()
  @IsNumber()
  used_point: number

  @IsOptional()
  @IsString()
  promo_code_id: string

  @IsOptional()
  @IsString()
  coupon_id: string
}
