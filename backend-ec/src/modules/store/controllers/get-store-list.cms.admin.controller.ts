import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { User } from '../../user/entity/user.entity'
import { StoreSearchService } from '../services/store-search.service'
/**
 * @oas [post] /stores/cms
 * operationId: "ListStoreOfCms"
 * summary: "List of store for cms"
 * description: "List of store for cms"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/GetStoreCmsBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  count:
 *                    type: integer
 *                  stores:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/store"
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
const listStoreCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const storeSearchService: StoreSearchService =
    req.scope.resolve('storeSearchService')

  const validated = await validator(GetListStoreCmsBody, req.body)

  const [stores, count] = await storeSearchService.searchStoreCms(validated)
  stores.forEach(async (store) => {
    store.owner = _.pick(store.owner, defaultCmsStoreOwnerFields) as User
  })

  res.json({ stores, count })
}

/**
 * @schema GetStoreCmsBody
 * title: "Get store list cms body"
 * description: "Get store list cms body"
 * x-resourceId: GetStoreCmsBody
 * properties:
 *  id:
 *    type: number
 *  company_official_name:
 *    type: string
 *  registration_number:
 *    type: string
 *  owner_id:
 *    type: number
 *  nickname:
 *    type: string
 *  name:
 *    type: string
 *  company_name:
 *    type: string
 *  company_name_kana:
 *    type: string
 *  url:
 *    type: string
 *  plan_type:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["prime", "standard"]
 *  number_product_from:
 *    type: number
 *  number_product_to:
 *    type: number
 *  status:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["approved", "pending"]
 *  business_form:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["personal", "company"]
 *  number_followers_from:
 *    type: number
 *  number_followers_to:
 *    type: number
 *  sale_price_from:
 *    type: number
 *  sale_price_to:
 *    type: number
 *  number_sale_from:
 *    type: number
 *  number_sale_to:
 *    type: number
 *  margin_rate_from:
 *    type: number
 *  margin_rate_to:
 *    type: number
 *  payment_method:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["auto_pay", "register"]
 *  is_return_guarantee:
 *    type: boolean
 *  approve:
 *    type: boolean
 *  account_number:
 *    type: string
 *  final_update_from:
 *    type: string
 *  final_update_to:
 *    type: string
 *  last_sale_from:
 *    type: string
 *  last_sale_to:
 *    type: string
 *  carry_over:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["yes","none"]
 *  repeat_action:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["yes","incomplete", "none"]
 *  eval_score_from:
 *    type: number
 *  eval_score_to:
 *    type: number
 *  type_lv1_id:
 *    type: string
 *  type_lv2_id:
 *    type: string
 *  type_id:
 *    type: string
 *  furigana:
 *    type: string
 *  limit:
 *    type: number
 *  offset:
 *    type: number
 */

export class GetListStoreCmsBody {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number

  @IsOptional()
  @IsArray()
  plan_type?: string[]

  @IsString()
  @IsOptional()
  name?: string

  @IsNumber()
  @IsOptional()
  id: number

  @IsString()
  @IsOptional()
  company_official_name: string

  @IsOptional()
  @IsString()
  registration_number: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  owner_id: number

  @IsOptional()
  @IsString()
  nickname: string

  @IsString()
  @IsOptional()
  company_name: string

  @IsString()
  @IsOptional()
  company_name_kana: string

  @IsString()
  @IsOptional()
  url: string

  @IsString()
  @IsOptional()
  furigana: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  number_product_from: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  number_product_to: number

  @IsOptional()
  @IsArray()
  status?: string[]

  @IsString()
  @IsOptional()
  type_lv2_id: string

  @IsString()
  @IsOptional()
  type_lv1_id: string

  @IsString()
  @IsOptional()
  type_id: string

  @IsOptional()
  @IsArray()
  business_form?: string[]

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  number_followers_from: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  number_followers_to: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sale_price_from: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  sale_price_to: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  number_sale_from: number

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  number_sale_to: number

  @IsNumber()
  @IsOptional()
  margin_rate_from: number

  @IsNumber()
  @IsOptional()
  margin_rate_to: number

  @IsOptional()
  @IsArray()
  payment_method?: string[]

  @IsBoolean()
  @IsOptional()
  is_return_guarantee: boolean

  @IsBoolean()
  @IsOptional()
  approve: boolean

  @IsString()
  @IsOptional()
  account_number: string

  @IsString()
  @IsOptional()
  final_update_from: string

  @IsString()
  @IsOptional()
  final_update_to: string

  @IsString()
  @IsOptional()
  last_sale_from: string

  @IsString()
  @IsOptional()
  last_sale_to: string

  @IsArray()
  @IsOptional()
  carry_over: string[]

  @IsArray()
  @IsOptional()
  repeat_action: string[]

  @IsNumber()
  @IsOptional()
  eval_score_from: number

  @IsNumber()
  @IsOptional()
  eval_score_to: number
}

export const defaultCmsStoreOwnerFields = [
  'id',
  'email',
  'first_name',
  'last_name',
  'nickname',
  'type',
  'customer',
]
export const defaultCmsStoreRelations = [
  'owner',
  'store_detail',
  'owner.customer',
  'payback_setting',
]

export default listStoreCmsController
