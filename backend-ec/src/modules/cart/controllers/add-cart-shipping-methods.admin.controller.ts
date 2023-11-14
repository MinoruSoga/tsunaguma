import {
  defaultStoreCartFields,
  defaultStoreCartRelations,
} from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { CartService } from '../services/cart.service'

/**
 * @oas [post] /carts/{id}/shipping-methods
 * operationId: "AddCartShippingMethods"
 * description: "Adds  Shipping Method to Line Item in the Cart."
 * summary: "Add a Shipping Methods"
 * parameters:
 *   - (path) id=* {string} The cart ID.
 * requestBody:
 *   description: Params to add shipping methods to cart
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AddCartShippingMethodsReq"
 * tags:
 *   - Cart
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *          properties:
 *            cart:
 *              $ref: "#/components/schemas/cart"
 *  "400":
 *    $ref: "#/components/responses/400_error"
 *  "404":
 *    $ref: "#/components/responses/not_found_error"
 *  "409":
 *    $ref: "#/components/responses/invalid_state_error"
 *  "422":
 *    $ref: "#/components/responses/invalid_request_error"
 *  "500":
 *    $ref: "#/components/responses/500_error"
 */
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const { id } = req.params

  const validated = await validator(AddCartShippingMethodsReq, req.body)

  const manager: EntityManager = req.scope.resolve('manager')
  const cartService: CartService = req.scope.resolve('cartService')

  await manager.transaction(async (m) => {
    const txCartService = cartService.withTransaction(m)

    await txCartService.upsertLineItemShippingMethods(id, validated.items)

    const updated = await txCartService.retrieve(id, {
      relations: ['payment_sessions'],
    })

    if (updated.payment_sessions?.length) {
      await txCartService.setPaymentSessions(id)
    }
  })

  const data = await cartService.retrieveWithTotals(id, {
    select: defaultStoreCartFields,
    relations: defaultStoreCartRelations,
  })

  res.status(200).json({ cart: data })
}

export class LineItemShippingMethodItem {
  @IsString()
  option_id: string

  @IsString()
  line_item_id: string

  @IsOptional()
  data?: Record<string, any> = {}
}

/**
 * @schema LineItemShippingMethodItem
 * title: "LineItemShippingMethodItem"
 * description: "LineItemShippingMethodItem"
 * x-resourceId: LineItemShippingMethodItem
 * type: object
 * required:
 *   - option_id
 *   - line_item_id
 * properties:
 *   option_id:
 *     type: string
 *   line_item_id:
 *     type: string
 *   data:
 *     type: object
 */

/**
 * @schema AddCartShippingMethodsReq
 * title: "AddCartShippingMethodsReq"
 * description: "Add cart shipping method params"
 * x-resourceId: AddCartShippingMethodsReq
 * type: object
 * required:
 *   - items
 * properties:
 *   items:
 *     type: array
 *     items:
 *         $ref: "#/components/schemas/LineItemShippingMethodItem"
 */
export class AddCartShippingMethodsReq {
  // @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LineItemShippingMethodItem)
  items: LineItemShippingMethodItem[]
}
