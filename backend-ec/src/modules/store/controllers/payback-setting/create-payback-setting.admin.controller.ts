import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { BankAccountType } from '../../entity/payback-setting.entity'
import { PaybackSettingService } from '../../services/payback-setting.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'

/**
 * @oas [post] /mystore/payback-setting
 * operationId: "CreatePaybackSetting"
 * summary: "Create a payback setting"
 * description: "Create a payback setting"
 * x-authenticated: true
 * requestBody:
 *   description: Params to create a payback setting
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *        $ref: "#/components/schemas/CreatePaybackSettingReq"
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

export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const paybackSettingService = req.scope.resolve(
    'paybackSettingService',
  ) as PaybackSettingService

  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const validated = await validator(CreatePaybackSettingReq, req.body)

  if (!loggedInUser.store_id) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      'This user does not have a store',
    )
  }

  await paybackSettingService.create(loggedInUser.store_id, {
    ...validated,
    user_id: loggedInUser.id,
  })

  res.sendStatus(201)
}

/**
 * @schema CreatePaybackSettingReq
 * title: "CreatePaybackSettingReq"
 * description: "PaybackSetting Req"
 * x-resourceId: CreatePaybackSettingReq
 * type: object
 * required:
 *   - account_name
 *   - account_type
 *   - account_number
 *   - bank_name
 *   - branch_code
 *   - branch_name
 * properties:
 *   account_name:
 *     type: string
 *   account_number:
 *     type: string
 *   branch_name:
 *     type: string
 *   branch_code:
 *     type: string
 *   bank_name:
 *     type: string
 *   bank_code:
 *     type: string
 *   account_type:
 *     $ref: "#/components/schemas/BankAccountType"
 */
export class CreatePaybackSettingReq {
  @IsString()
  account_name: string

  @IsEnum(BankAccountType, {
    always: true,
    message: `Invalid value (bank account type must be one of following values: ${Object.values(
      BankAccountType,
    ).join(', ')})`,
  })
  account_type: BankAccountType

  @IsString()
  @Length(7, 7, { message: 'Account number must be 7 characters length' })
  @Matches(/^[0-9]+$/, { message: 'Account number must only contain number' })
  account_number: string

  @IsString()
  @Length(3, 3, { message: 'Branch code must be 3 characters length' })
  @Matches(/^[0-9]+$/, { message: 'Branch code must only contain number' })
  branch_code: string

  @IsString()
  branch_name: string

  @IsString()
  bank_name: string

  @IsString()
  @IsOptional()
  bank_code?: string
}
