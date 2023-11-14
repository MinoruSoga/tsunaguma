import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { StoreBusinessForm } from '../../entity/store.entity'
import { Gender, StorePaymentMethod } from '../../entity/store-detail.entity'
import { StoreDetailService } from '../../services/store-detail.service'

/**
 * @oas [patch] /store
 * operationId: "UpdateStoreCustomerInfo"
 * summary: "Update a customer info"
 * description: "Update a customer info"
 * x-authenticated: true
 * requestBody:
 *   description: Params to update a store customer info
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *        $ref: "#/components/schemas/UpdateStoreCustomerInfoReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   204:
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
export default async (req: MedusaRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const storeDetailService = req.scope.resolve(
    'storeDetailService',
  ) as StoreDetailService

  const validated = await validator(UpdateStoreCustomerInfoReq, req.body)

  await storeDetailService.update(loggedInUser.id, validated)

  res.sendStatus(204)
}

/**
 * @schema UpdateStoreCustomerInfoReq
 * title: "Update customer info Params"
 * description: "Update customer info Params"
 * x-resourceId: UpdateStoreCustomerInfoReq
 * properties:
 *   firstname:
 *     type: string
 *     description: "Kanji first nanme of the seller"
 *   lastname:
 *     type: string
 *     description: "Kanji last nanme of the seller"
 *   firstname_kana:
 *     type: string
 *     description: "Furigana first nanme of the seller"
 *   lastname_kana:
 *     type: string
 *     description: "Furigana last nanme of the seller"
 *   gender:
 *     $ref: "#/components/schemas/GenderEnum"
 *   post_code:
 *     type: string
 *   addr_01:
 *     type: string
 *     maxLength: 16
 *     description: "Street name of the store"
 *   addr_02:
 *     type: string
 *     maxLength: 16
 *     description: "Building name of the store"
 *   prefecture_id:
 *     type: string
 *     description: "Prefecture id of the store"
 *   tel_number:
 *     type: string
 *     description: "Phone number of the seller"
 *   birthday:
 *     type: string
 *     format: date
 *     description: "Date of birth of the seller"
 *   business_form:
 *     $ref: "#/components/schemas/StoreBusinessFormEnum"
 *   payment_method:
 *     $ref: "#/components/schemas/StorePaymentMethod"
 *   referral_code:
 *     type: string
 *   mobile_number:
 *     type: string
 *     description: "Mobile number of the seller"
 *   emerge_number:
 *     type: string
 *     description: "Emergency phone number number of the seller"
 *   company_name:
 *      type: string
 *      description: "Kanji corporation name of the rep"
 *   company_name_kana:
 *      type: string
 *      description: "Furigana corporation name of the rep"
 *   contact_firstname:
 *      type: string
 *      minLength: 16
 *      description: "Curator kanji first name"
 *   contact_lastname:
 *      type: string
 *      description: "Curator kanji first name"
 *   contact_firstname_kana:
 *      type: string
 *      description: "Curator furigana first name"
 *   contact_lastname_kana:
 *      type: string
 *      description: "Curator furigana last name"
 *   url:
 *      type: string
 *      description: "Website URL"
 *   contact_tel:
 *      type: string
 *      description: "Curator's phone number"
 *   company_official_name:
 *      type: string
 *   registration_number:
 *      type: string
 */

export class UpdateStoreCustomerInfoReq {
  // common information
  @IsString()
  @IsOptional()
  firstname?: string

  @IsString()
  @IsOptional()
  lastname?: string

  @IsString()
  @IsOptional()
  firstname_kana?: string

  @IsString()
  @IsOptional()
  lastname_kana?: string

  @IsString()
  @IsOptional()
  post_code?: string

  @IsString()
  @IsOptional()
  prefecture_id?: string

  @IsString()
  @IsOptional()
  addr_01?: string

  @IsString()
  @IsOptional()
  addr_02?: string

  @IsString()
  @IsOptional()
  tel_number?: string

  @IsOptional()
  @IsEnum(Gender, {
    always: true,
    message: `Invalid value (gender must be one of following values: [${Object.values(
      Gender,
    ).join(',')}])`,
  })
  gender?: Gender

  @IsOptional()
  @IsString()
  birthday?: string

  @IsOptional()
  @IsEnum(StoreBusinessForm, {
    always: true,
    message: `Invalid value (business_form must be one of following values: [${Object.values(
      StoreBusinessForm,
    ).join(',')}])`,
  })
  business_form?: StoreBusinessForm

  @IsOptional()
  @IsEnum(StorePaymentMethod, {
    always: true,
    message: `Invalid value (payment_method must be one of following values: [${Object.values(
      StorePaymentMethod,
    ).join(',')}])`,
  })
  payment_method?: StorePaymentMethod

  // for individual
  @IsOptional()
  @IsString()
  mobile_number?: string

  @IsOptional()
  @IsString()
  emerge_number?: string

  // for company
  @IsOptional()
  @IsString()
  company_name?: string

  @IsOptional()
  @IsString()
  company_name_kana?: string

  @IsOptional()
  @IsString()
  url?: string

  @IsOptional()
  @IsString()
  contact_firstname?: string

  @IsOptional()
  @IsString()
  contact_lastname?: string

  @IsOptional()
  @IsString()
  contact_firstname_kana?: string

  @IsOptional()
  @IsString()
  contact_lastname_kana?: string

  @IsOptional()
  @IsString()
  contact_tel?: string

  @IsOptional()
  @IsString()
  company_official_name?: string

  @IsOptional()
  @IsString()
  registration_number?: string
}
