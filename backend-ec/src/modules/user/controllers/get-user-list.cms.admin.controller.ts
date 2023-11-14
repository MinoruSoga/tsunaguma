import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../constant'
import { UserSearchService } from '../services/user-search.service'
/**
 * @oas [post] /users/search
 * operationId: "ListUser"
 * summary: "List of user"
 * description: "List of user"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/GetListUserBody"
 * tags:
 *   - User
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
 *                  users:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/user"
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
const listUserController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const userSearchService: UserSearchService =
    req.scope.resolve('userSearchService')

  const validated = await validator(GetListUserBody, req.body)

  const [users, count] = await userSearchService.seachCustomer(validated)

  res.status(200).json({ users: users, count })
}

export default listUserController

/**
 * @schema GetListUserBody
 * title: "Get list user cms body"
 * description: "Get list user cms body"
 * x-resourceId: GetListUserBody
 * properties:
 *  display_id:
 *    type: number
 *  type:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["store_standard", "store_prime", "customer", "admin_admin", "admin_staff"]
 *  fullname:
 *    type: string
 *  fullname_furigana:
 *    type: string
 *  nickname:
 *    type: string
 *  email:
 *    type: string
 *  phone:
 *    type: string
 *  points_from:
 *    type: number
 *  points_to:
 *    type: number
 *  use_time_from:
 *    type: number
 *  use_time_to:
 *    type: number
 *  total_amount_from:
 *    type: number
 *  total_amount_to:
 *    type: number
 *  return_record_from:
 *    type: number
 *  return_record_to:
 *    type: number
 *  product_id:
 *    type: number
 *  created_from:
 *    type: string
 *  created_to:
 *    type: string
 *  gb_flag:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["yes","none"]
 *  email_notification:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *    example: ["register","unregister"]
 *  gender:
 *    type: array
 *    items:
 *      oneOf:
 *        - $ref: "#/components/schemas/GenderEnum"
 *    example: ["register","unregister"]
 *  type_lv1_id:
 *    type: string
 *  type_lv2_id:
 *    type: string
 *  type_id:
 *    type: string
 *  product_code:
 *    type: string
 *  birthday_month:
 *    type: number
 *  birthday_from:
 *    type: string
 *  birthday_to:
 *    type: string
 *  limit:
 *    type: number
 *  offset:
 *    type: number
 */
export class GetListUserBody {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number

  @IsOptional()
  @IsNumber()
  display_id: number

  @IsOptional()
  @IsArray()
  type: string[]

  @IsOptional()
  @IsString()
  fullname: string

  @IsOptional()
  @IsString()
  fullname_furigana: string

  @IsOptional()
  @IsString()
  nickname: string

  @IsOptional()
  @IsString()
  email: string

  @IsOptional()
  @IsString()
  phone: string

  @IsOptional()
  @IsNumber()
  points_from: number

  @IsOptional()
  @IsNumber()
  points_to: number

  @IsOptional()
  @IsNumber()
  total_amount_from: number

  @IsOptional()
  @IsNumber()
  total_amount_to: number

  @IsOptional()
  @IsNumber()
  use_time_from: number

  @IsOptional()
  @IsNumber()
  use_time_to: number

  @IsOptional()
  @IsNumber()
  return_record_from: number

  @IsOptional()
  @IsNumber()
  return_record_to: number

  @IsOptional()
  @IsNumber()
  product_id: number

  @IsOptional()
  @IsString()
  type_id: string

  @IsOptional()
  @IsString()
  type_lv1_id: string

  @IsOptional()
  @IsString()
  type_lv2_id: string

  @IsOptional()
  @IsArray()
  email_notification: string[]

  @IsOptional()
  @IsArray()
  gb_flag: string[]

  @IsOptional()
  @IsString()
  created_from: string

  @IsOptional()
  @IsString()
  created_to: string

  @IsOptional()
  @IsString()
  product_code: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  birthday_month: number

  @IsOptional()
  @IsString()
  birthday_from: string

  @IsOptional()
  @IsString()
  birthday_to: string

  @IsOptional()
  @IsArray()
  gender: string[]
}
