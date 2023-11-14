import {
  defaultStoreCartFields,
  defaultStoreCartRelations,
  StorePostCartsCartLineItemsItemReq,
} from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest, Validator } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { CartService } from '../services/cart.service'
import { StorePostCartLineItemMetadata } from './create-line-item.store.controller'

/**
 * @oas [post] /carts/{id}/line-items/{line_id}
 * operationId: PostCartsCartLineItemsItem
 * summary: Update a Line Item
 * description: "Updates a Line Item if the desired quantity can be fulfilled."
 * parameters:
 *   - (path) id=* {string} The id of the Cart.
 *   - (path) line_id=* {string} The id of the Line Item.
 * requestBody:
 *   description: Params to create a product addon
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateLineItemReq"
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
  const { id, line_id } = req.params

  const validated = await validator(
    ExtendedStorePostCartsCartLineItemsItemReq,
    req.body,
  )

  const manager: EntityManager = req.scope.resolve('manager')
  const cartService: CartService = req.scope.resolve('cartService')

  await manager.transaction(async (m) => {
    // If the quantity is 0 that is effectively deletion
    if (validated.quantity === 0) {
      await cartService.withTransaction(m).removeLineItem(id, line_id)
    } else {
      const cart = await cartService
        .withTransaction(m)
        .retrieve(id, { relations: ['items'] })

      const existing = cart.items.find((i) => i.id === line_id)
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Could not find the line item',
        )
      }

      const lineItemUpdate: any = {
        variant_id: existing.variant.id,
        region_id: cart.region_id,
        quantity: validated.quantity,
        metadata: validated.metadata || existing.metadata,
      }

      if (validated.shipping_method_id)
        lineItemUpdate.shipping_method_id = validated.shipping_method_id

      await cartService
        .withTransaction(m)
        .updateLineItem(id, line_id, lineItemUpdate)
    }

    // If the cart has payment sessions update these
    const updated = await cartService.withTransaction(m).retrieve(id, {
      relations: ['payment_sessions'],
    })

    if (updated.payment_sessions?.length) {
      await cartService.withTransaction(m).setPaymentSessions(id)
    }
  })

  const data = await cartService.retrieveWithTotals(id, {
    select: defaultStoreCartFields,
    relations: defaultStoreCartRelations,
  })

  res.status(200).json({ cart: data })
}

/**
 * @schema UpdateLineItemReq
 * title: "UpdateLineItemReq"
 * description: "Update line item request params"
 * x-resourceId: UpdateLineItemReq
 * type: object
 * properties:
 *   quantity:
 *     type: number
 *   metadata:
 *     type: object
 *     properties:
 *       addons:
 *         type: array
 *         items:
 *            $ref: "#/components/schemas/LineItemAddonReq"
 *   shipping_method_id:
 *     type: string
 */

@Validator({ override: StorePostCartsCartLineItemsItemReq })
export class ExtendedStorePostCartsCartLineItemsItemReq extends StorePostCartsCartLineItemsItemReq {
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => StorePostCartLineItemMetadata)
  metadata?: StorePostCartLineItemMetadata

  @IsOptional()
  @IsString()
  shipping_method_id?: string
}
