import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDefined,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { ShippingOptionService } from '../services/shipping-option.service'
import {
  ShippingItemReq,
  ShippingOptionDataReq,
} from './create-shipping-option.admin.controller'
/**
 * @oas [put] /shipping-option/{id}
 * operationId: "UpdateShippingOption"
 * summary: "Update a Shipping Option of a store"
 * description: "Update a shipping option of a store"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Shipping Option.
 * requestBody:
 *   description: Params to update a shipping option
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *        $ref: "#/components/schemas/UpdateShippingOptionReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ShippingOption
 * responses:
 *   204:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *            $ref: "#/components/schemas/shipping_option"
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
const updateShippingOptionController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params
  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    'shippingOptionService',
  )
  const manager: EntityManager = await req.scope.resolve('manager')

  const validated: any = await validator(UpdateShippingOptionReq, req.body)

  const { from_pref_id, ...rest } = validated

  const reqValue = {
    ...rest,
    metadata: from_pref_id ? { from_pref_id } : null,
  }

  await manager.transaction(async (transactionManager) => {
    return await shippingOptionService
      .withTransaction(transactionManager)
      .update_(id, reqValue)
  })

  const result = await shippingOptionService.retrieve(id)
  res.status(200).json(result)
}

export default updateShippingOptionController

/**
 * @schema UpdateShippingOptionReq
 * title: "UpdateShippingOptionReq"
 * description: "UpdateShippingOptionReq"
 * x-resourceId: UpdateShippingOptionReq
 * type: object
 * properties:
 *  name:
 *    type: string
 *    description: amount of nation shipping
 *  is_docs:
 *    type: boolean
 *  is_warranty:
 *    type: boolean
 *  is_trackable:
 *    type: boolean
 *  provider:
 *    $ref: "#/components/schemas/ShippingItemReq"
 *  size_id:
 *    type: string
 *  from_pref_id:
 *    type: string
 *  data:
 *    type: object
 *    properties:
 *      all:
 *       type: number
 *      prefs:
 *       type: object
 */
export class UpdateShippingOptionReq {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsBoolean()
  is_docs?: boolean

  // @IsOptional()
  // @IsNotEmptyObject()
  // @ValidateNested()
  // @Type(() => ShippingItemReq)
  // size?: ShippingItemReq
  @IsOptional()
  @IsString()
  size_id?: string

  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ShippingOptionDataReq)
  data?: ShippingOptionDataReq

  @IsOptional()
  @IsBoolean()
  is_trackable?: boolean

  @IsOptional()
  @IsBoolean()
  is_warranty?: boolean

  @IsOptional()
  @IsString()
  from_pref_id?: string

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => ShippingItemReq)
  provider: ShippingItemReq
}
