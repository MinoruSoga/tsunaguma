import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { WithdrawalReasonType } from '../../entity/withdrawnal-reason.entity'
import WithdrawalService from '../../services/withdrawal.service'

/**
 * @oas [get] /users/withdrawal/reason
 * operationId: "GetWithdrawalReason"
 * summary: "Get list reasons of withdrawal"
 * description: "Get list reasons of withdrawal"
 * x-authenticated: false
 * parameters:
 *   - in: query
 *     name: type
 *     required: false
 *     schema:
 *       $ref: "#/components/schemas/WithdrawalReasonTypeEnum"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Withdrawal
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *          type: array
 *          items:
 *              $ref: "#/components/schemas/withdrawal_reason"
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
export default async function (req: MedusaRequest, res: Response) {
  const validated = await validator(GetWithdrawalReasonParams, req.query)
  const withdrawalService = req.scope.resolve<WithdrawalService>(
    WithdrawalService.resolutionKey,
  )
  const reasons = await withdrawalService.getReasons(validated.type)
  res.json(reasons)
}

class GetWithdrawalReasonParams {
  @IsOptional()
  @IsEnum(WithdrawalReasonType, {
    always: true,
    message: `Invalid value (withdrawal type must be one of following values: [${Object.values(
      WithdrawalReasonType,
    ).join(',')}])`,
  })
  type: WithdrawalReasonType
}
