import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import WithdrawalService from '../../services/withdrawal.service'

/**
 * @schema CreateWithdrawalReq
 * title: "CreateWithdrawalReq"
 * description: "Create withdrawlal request body"
 * x-resourceId: CreateWithdrawalReq
 * type: object
 * required:
 *   - reasons
 * properties:
 *   reasons:
 *     type: array
 *     items:
 *        type: string
 *   note:
 *     description: "Withdrawal note"
 *     type: string
 */
export class CreateWithdrawalReq {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  reasons: string[]

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note: string
}

/**
 * @oas [post] /users/withdrawal
 * operationId: "CreateWithdrawal"
 * summary: "Create user withdrawal"
 * description: "Create user withdrawal"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/CreateWithdrawalReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Withdrawal
 * responses:
 *   "201":
 *     description: OK
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
export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const validated = await validator(CreateWithdrawalReq, req.body)
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const withdrawalService = req.scope.resolve<WithdrawalService>(
    WithdrawalService.resolutionKey,
  )

  await withdrawalService.create(loggedInUser.id, validated)

  res.sendStatus(201)
}
