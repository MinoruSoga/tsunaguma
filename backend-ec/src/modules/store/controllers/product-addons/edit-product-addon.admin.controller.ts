import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductAddonService } from '../../services/product-addon.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [patch] /mystore/product-addon/{id}
 * operationId: "UpdateProductAddon"
 * summary: "Update a Product Addon"
 * description: "Update a Product Addon that can redeemed by its unique code."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product Addon
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *          $ref: "#/components/schemas/EditProductAddonReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   200:
 *     description: OK
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
const editProductAddonController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const productAddonService: ProductAddonService = req.scope.resolve(
    ProductAddonService.resolutionKey,
  )
  const id = req.params.id

  const validated = await validator(EditProductAddonReq, req.body)
  await productAddonService.update(loggedInUser.store_id, id, validated)
  res.sendStatus(204)
}

/**
 * @schema ProductAddonEditItem
 * title: "ProductAddonEditItem"
 * description: "Product Addon Edit Item"
 * x-resourceId: ProductAddonEditItem
 * type: object
 * properties:
 *  id:
 *    type: string
 *    description: name id product addon
 *    example: prod_addon_1
 *  name:
 *    type: string
 *    description: name of product addon
 *    example: addon 1
 *  price:
 *    type: number
 *    description: Price of product addon
 *    example: 青森県
 *  isDeleted:
 *    type: boolean
 *    description: Is deleted flag
 *    example: 青森県
 */
export class ProductAddonEditItem {
  @IsOptional()
  @IsString()
  id?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsInt()
  price?: number

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean
}

/**
 * @schema EditProductAddonReq
 * title: "EditProductAddonReq"
 * description: "EditProductAddonReq"
 * x-resourceId: EditProductAddonReq
 * type: object
 * properties:
 *  name:
 *    type: string
 *    description: name of product addon
 *    example: addon 1
 *  price:
 *    type: number
 *    description: Price of product addon
 *    example: 青森県
 *  children:
 *    type: array
 *    items:
 *      $ref: "#/components/schemas/ProductAddonEditItem"
 */
export class EditProductAddonReq {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Price can not be less than 0' })
  price?: number

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductAddonEditItem)
  children?: ProductAddonEditItem[]
}

export default editProductAddonController
