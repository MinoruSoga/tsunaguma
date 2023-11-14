import { StorePostCartsCartLineItemsReq } from '@medusajs/medusa'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Validator } from 'medusa-extender'

/**
 * @oas [post] /carts/{id}/line-items
 * operationId: PostCartsCartLineItems
 * summary: "Add a Line Item"
 * description: "Generates a Line Item with a given Product Variant and adds it
 *   to the Cart"
 * parameters:
 *   - (path) id=* {string} The id of the Cart to add the Line Item to.
 * requestBody:
 *   description: Params to create a product addon
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/CreateLineItemReq"
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

/**
 * @schema LineItemAddonReq
 * title: "LineItemAddonReq"
 * description: "Create line item addons"
 * x-resourceId: LineItemAddonReq
 * type: object
 * required:
 *   - lv1_id
 *   - lv2_id
 * properties:
 *   lv1_id:
 *     type: string
 *   lv2_id:
 *     type: string
 *   price:
 *     type: number
 */

/**
 * @schema CreateLineItemReq
 * title: "CreateLineItemReq"
 * description: "Create line item request params"
 * x-resourceId: CreateLineItemReq
 * type: object
 * required:
 *   - variant_id
 *   - quantity
 * properties:
 *   variant_id:
 *     type: string
 *   quantity:
 *     type: number
 *   metadata:
 *     type: object
 *     properties:
 *       addons:
 *         type: array
 *         items:
 *            $ref: "#/components/schemas/LineItemAddonReq"
 */

export class StorePostCartLineItemAddon {
  @IsString()
  lv1_id: string

  @IsString()
  lv2_id: string

  @IsOptional()
  @IsInt()
  price: number
}

export class StorePostCartLineItemMetadata {
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => StorePostCartLineItemAddon)
  addons: StorePostCartLineItemAddon[]
}

@Validator({ override: StorePostCartsCartLineItemsReq })
export class ExtendsStorePostCartsCartLineItemsReq {
  @IsString()
  variant_id: string

  @IsInt()
  quantity: number

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => StorePostCartLineItemMetadata)
  metadata?: StorePostCartLineItemMetadata
}
