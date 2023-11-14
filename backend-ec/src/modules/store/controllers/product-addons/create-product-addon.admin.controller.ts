import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductAddon } from '../../entity/product-addon.entity'
import { ProductAddonService } from '../../services/product-addon.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [post] /mystore/product-addon
 * operationId: "CreateProductAddon"
 * summary: "Create a Product Addon"
 * description: "Creates a add on of a store"
 * x-authenticated: true
 * requestBody:
 *   description: Params to create a product addon
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - name
 *         properties:
 *           name:
 *             type: string
 *             description: The name of the new product addon.
 *           price:
 *             type: number
 *             description: Price of the product addon
 *             example: 青森県
 *           parent_id:
 *             type: string
 *             description: The parent's id of the new product addon.
 *           items:
 *             type: array
 *             items:
 *               $ref: "#/components/schemas/ProductAddonItem"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   201:
 *     description: Created
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
const createProductAddonController = async (
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
  const manager: EntityManager = req.scope.resolve('manager')

  const validated = await validator(CreateProductAddonReq, req.body)
  let rootAddon: DeepPartial<ProductAddon> = {
    name: validated.name,
    store_id: loggedInUser.store_id,
    parent_id: validated.parent_id || null,
    price: validated.price || null,
  }

  if (validated.parent_id) {
    // create a child addon
    const parent = await productAddonService.retrieve(
      loggedInUser.store_id,
      validated.parent_id,
    )
    rootAddon.parent = parent
  }

  if (!validated.items) {
    await productAddonService.save(rootAddon)
  } else {
    const childrenAddon: DeepPartial<ProductAddon>[] = validated.items.map(
      (item, index) => ({
        ...item,
        store_id: loggedInUser.store_id,
        rank: index + 1,
      }),
    )
    await manager.transaction(async (transactionManager) => {
      rootAddon = await productAddonService.save(rootAddon, transactionManager)
      const promises = childrenAddon.map(async (item) => {
        item.parent = rootAddon
        await productAddonService.save(item, transactionManager)
      })
      return await Promise.all(promises)
    })
  }

  res.sendStatus(201)
}

export default createProductAddonController

/**
 * @schema ProductAddonItem
 * title: "ProductAddonItem"
 * description: "Product Addon Item"
 * x-resourceId: ProductAddonItem
 * type: object
 * required:
 *   - name
 *   - price
 * properties:
 *  name:
 *    type: string
 *    description: name of product addon
 *    example: pref_1
 *  price:
 *    type: number
 *    description: Price of product addon
 *    example: 青森県
 */
export class ProductAddonItem {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsNumber()
  @Min(0, { message: 'Price can not be less than 0' })
  price: number
}
export class CreateProductAddonReq {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  parent_id?: string

  @IsOptional()
  @IsNumber()
  price?: number

  @ValidateNested({ each: true })
  @Type(() => ProductAddonItem)
  items: ProductAddonItem[]
}
