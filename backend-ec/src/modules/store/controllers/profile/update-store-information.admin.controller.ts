import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { StorePhotoServiceEnum } from '../../entity/store.entity'
import StoreService from '../../services/store.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [put] /mystore/information
 * operationId: "UpdateStoreInformation"
 * summary: "update store information"
 * description: "update store information."
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Profile
 * requestBody:
 *   description: Params to update shop information
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdateStoreInformationReq"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/store"
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
 *
 */
const updateStoreInformationController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const storeService: StoreService = req.scope.resolve('storeService')
  const validated: UpdateStoreInformationReq = await validator(
    UpdateStoreInformationReq,
    req.body,
  )

  const store = await storeService.updateStoreInformation(
    loggedInUser.id,
    validated,
  )

  res.status(200).json(store)
}
export default updateStoreInformationController

/**
 * @schema UpdateStoreInformationReq
 * title: "UpdateStoreInformationReq"
 * description: "update store information params"
 * x-resourceId: UpdateStoreInformationReq
 * type: object
 * properties:
 *  avatar:
 *    type: string
 *    description: Avatar of shop
 *  name:
 *    type: string
 *    description: Name of shop
 *  intro:
 *    type: string
 *    description: Intro of shop
 *  about:
 *    type: string
 *    description: about of shop
 *  url:
 *    type: string
 *    description: URL of shop
 *  web_url:
 *    type: string
 *    description: Web URL of shop
 *  images:
 *    type: array
 *    description: List images of shop
 *  sns_instagram:
 *    type: string
 *    description: Instagram information of shop
 *  sns_twitter:
 *    type: string
 *    description: Twitter information of shop
 *  sns_facebook:
 *    type: string
 *    description: Facebook information of shop
 *  photo_service:
 *    $ref: "#/components/schemas/StorePhotoServiceEnum"
 *    description: Photo service type of shop
 *  photo_service_note:
 *    type: string
 *    description: Photo service note of shop
 *  return_guarantee_note:
 *    type: string
 *    description: Return guarantee note of shop
 *  is_return_guarantee:
 *    description: "has return guarantee"
 *    type: boolean
 *  is_closed:
 *    description: "is store closed or not"
 *    type: boolean
 */
export class UpdateStoreInformationReq {
  @IsString()
  @IsOptional()
  avatar: string

  @IsString()
  @IsOptional()
  name: string

  @IsString()
  @IsOptional()
  intro: string | null

  @IsString()
  @IsOptional()
  about: string | null

  @IsOptional()
  @IsString()
  url: string

  @IsString()
  @IsOptional()
  web_url: string | null

  @IsArray()
  @IsOptional()
  images: string[]

  @IsString()
  @IsOptional()
  sns_instagram: string | null

  @IsString()
  @IsOptional()
  sns_twitter: string | null

  @IsString()
  @IsOptional()
  sns_facebook: string | null

  @IsEnum(StorePhotoServiceEnum, {
    always: true,
    message: `Invalid value (photo service must be one of following values: ${Object.values(
      StorePhotoServiceEnum,
    ).join(', ')})`,
  })
  @IsOptional()
  photo_service: StorePhotoServiceEnum

  @IsString()
  @IsOptional()
  photo_service_note: string

  @IsString()
  @IsOptional()
  return_guarantee_note: string

  @IsBoolean()
  @IsOptional()
  is_return_guarantee: boolean

  @IsBoolean()
  @IsOptional()
  is_closed: boolean
}
