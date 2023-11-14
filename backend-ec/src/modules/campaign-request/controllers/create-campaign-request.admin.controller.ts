import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../user/constant'
import {
  CampaignRequestStatus,
  CampaignRequestType,
} from '../entities/campaign-request.entity'
import { CampaignRequestService } from '../service/campaign-request.service'

/**
 * @oas [post] /campaign-request
 * operationId: "AddCampaignRequest"
 * summary: "add campaign request"
 * description: "add campaign request"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/PostCampaignRequestReq"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - CampaignRequest
 * responses:
 *   201:
 *     description: Created
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

export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const validated: PostCampaignRequestReq = await validator(
    PostCampaignRequestReq,
    req.body,
  )

  const campaignRequestService = req.scope.resolve<CampaignRequestService>(
    CampaignRequestService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const isUserAdmin = isAdmin(loggedInUser)

  if (isUserAdmin) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, 'Unauthorized')
  }

  if (!loggedInUser?.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const result = await campaignRequestService.create({
    ...validated,
    status: CampaignRequestStatus.REQUEST,
    store_id: loggedInUser.store_id,
  })

  res.status(201).json(result)
}

/**
 * @schema PostCampaignRequestReq
 * title: "PostCampaignRequestReq"
 * description: "Post campaign request Req"
 * x-resourceId: PostCampaignRequestReq
 * type: object
 * required:
 *   - type
 *   - product_id
 * properties:
 *   product_id:
 *     type: string
 *   type:
 *     $ref: "#/components/schemas/CampaignRequestType"
 *   metadata:
 *     type: object
 *   expired_at:
 *     type: string
 */

export class PostCampaignRequestReq {
  @IsString()
  @IsNotEmpty()
  product_id: string

  @IsEnum(CampaignRequestType, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      CampaignRequestType,
    ).join(', ')})`,
  })
  type: CampaignRequestType

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsString()
  @IsOptional()
  expired_at: string
}
