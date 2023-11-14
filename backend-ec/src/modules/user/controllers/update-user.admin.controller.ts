import { AdminUpdateUserRequest } from '@medusajs/medusa/dist/api/routes/admin/users/update-user'
import { IsType } from '@medusajs/medusa/dist/utils/validators/is-type'
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'
import { Validator } from 'medusa-extender'

import { ExtendedAddressCreatePayload } from './address/create-address.store.controller'

/**
 * @oas [post] /users/{id}
 * operationId: PostUsersUser
 * summary: "Update a User"
 * description: "Updates a User"
 * parameters:
 *   - (path) id=* {string} The ID of the User.
 * requestBody:
 *   description: Params to update user
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminUpdateUserReq"
 * tags:
 *   - User
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             user:
 *               $ref: "#/components/schemas/customer"
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
 * @schema AdminUpdateUserReq
 * title: "AdminUpdateUserReq"
 * description: "Admin Update admin Req"
 * x-resourceId: AdminUpdateUserReq
 * type: object
 * properties:
 *   avatar:
 *     type: string
 *   nickname:
 *     type: string
 *   first_name:
 *     type: string
 *   last_name:
 *     type: string
 *   new_noti_cnt:
 *     type: number
 *   is_reset_avatar:
 *     type: boolean
 *   address:
 *     anyOf:
 *      - $ref: "#/components/schemas/address"
 *        description: A full shipping address object.
 *      - type: string
 *        description: The shipping address ID
 */

@Validator({ override: AdminUpdateUserRequest })
export class AdminUpdateUserReq extends AdminUpdateUserRequest {
  @IsString()
  @IsOptional()
  avatar: string

  @IsString()
  @IsOptional()
  nickname: string

  @IsOptional()
  @IsType([ExtendedAddressCreatePayload, String])
  address?: ExtendedAddressCreatePayload | string

  @IsOptional()
  @IsNumber()
  new_noti_cnt?: number

  @IsOptional()
  @IsBoolean()
  is_reset_avatar = false
}
