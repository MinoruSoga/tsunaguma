import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDefined,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ShippingOptionService } from '../services/shipping-option.service'
import { ShippingProfileService } from './../services/shipping-profile.service'

/**
 * @oas [post] /shipping-option
 * operationId: "CreateShippingOption"
 * summary: "Create a Shipping Option of a store"
 * description: "Creates a shipping option of a store"
 * x-authenticated: true
 * requestBody:
 *   description: Params to create a shipping option
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/CreateShippingOptionReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ShippingOption
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
const createShippingOptionController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    'shippingOptionService',
  )
  const shippingProfileService: ShippingProfileService = req.scope.resolve(
    'shippingProfileService',
  )

  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const manager: EntityManager = await req.scope.resolve('manager')

  const validated: any = await validator(CreateShippingOptionReq, req.body)

  const { from_pref_id, ...rest } = validated

  const profile = await shippingProfileService.retrieveDefault(
    loggedInUser.store_id,
  )
  if (!profile)
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Can not find any shipping profile',
    )
  rest.profile_id = profile.id

  const reqValue = from_pref_id
    ? {
        ...rest,
        metadata: {
          from_pref_id,
        },
      }
    : rest

  await manager.transaction(async (transactionManager) => {
    return await shippingOptionService
      .withTransaction(transactionManager)
      .save(loggedInUser.store_id, reqValue)
  })

  res.sendStatus(201)
}

/**
 * @schema ShippingItemReq
 * title: "ShippingItemReq"
 * description: "ShippingItemReq"
 * x-resourceId: ShippingItemReq
 * required:
 *   - id
 * type: object
 * properties:
 *  id:
 *    type: string
 *    description: id of the item
 *  name:
 *    type: string
 *    description: name of the item
 */

export class ShippingItemReq {
  @IsString()
  @IsOptional()
  id?: string

  @IsOptional()
  @IsString()
  name?: string // for free input
}

/**
 * @schema ShippingOptionDataReq
 * title: "ShippingOptionDataReq"
 * description: "ShippingOptionDataReq"
 * x-resourceId: ShippingOptionDataReq
 * type: object
 * properties:
 *  all:
 *    type: number
 *    description: amount of nation shipping
 *  prefs:
 *    type: object
 */
export class ShippingOptionDataReq {
  @IsOptional()
  @IsNumber()
  all?: number

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  prefs?: Record<string, number>
}

/**
 * @schema CreateShippingOptionReq
 * title: "CreateShippingOptionReq"
 * description: "CreateShippingOptionReq"
 * x-resourceId: CreateShippingOptionReq
 * required:
 *           - name
 *           - provider
 * properties:
 *           name:
 *             type: string
 *             description: The name of the new shipping option.
 *           is_docs:
 *             type: boolean
 *           is_trackable:
 *             type: boolean
 *           is_warranty:
 *             type: boolean
 *           provider:
 *             $ref: "#/components/schemas/ShippingItemReq"
 *           size_id:
 *             type: string
 *           from_pref_id:
 *             type: string
 *           data:
 *             $ref: "#/components/schemas/ShippingOptionDataReq"
 */
export class CreateShippingOptionReq {
  @IsString()
  name: string

  @IsOptional()
  @IsBoolean()
  is_docs?: boolean

  @IsOptional()
  @IsBoolean()
  is_trackable?: boolean

  @IsOptional()
  @IsBoolean()
  is_warranty?: boolean

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingItemReq)
  provider: ShippingItemReq

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingOptionDataReq)
  data: ShippingOptionDataReq

  // @IsOptional()
  // @IsDefined()
  // @IsNotEmptyObject()
  // @ValidateNested()
  // @Type(() => ShippingItemReq)
  // size?: ShippingItemReq
  @IsOptional()
  @IsString()
  size_id?: string

  @IsOptional()
  @IsString()
  from_pref_id?: string
}

export default createShippingOptionController
