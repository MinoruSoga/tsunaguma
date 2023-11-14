import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import {
  CampaignRequestStatus,
  CampaignRequestType,
} from '../entities/campaign-request.entity'
import { CampaignRequestService } from '../service/campaign-request.service'

/**
 * @oas [put] /campaign-request/{id}
 * operationId: "UpdateCampaignRequest"
 * summary: "update campaign request"
 * description: "update campaign request"
 * parameters:
 *   - (path) id=* {string} The ID of the Campaign request.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         $ref: "#/components/schemas/PutCampaignRequestReq"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - CampaignRequest
 * responses:
 *   200:
 *     description: Ok
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/campaign_request"
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

  const id = req.params.id

  const result = await campaignRequestService.update(id, validated)

  res.status(200).json(result)
}

/**
 * @schema PutCampaignRequestReq
 * title: "PutCampaignRequestReq"
 * description: "Put campaign request Req"
 * x-resourceId: PutCampaignRequestReq
 * type: object
 * properties:
 *   product_id:
 *     type: string
 *   type:
 *     $ref: "#/components/schemas/CampaignRequestType"
 *   status:
 *     $ref: "#/components/schemas/CampaignRequestStatus"
 *   metadata:
 *     type: object
 *   expired_at:
 *     type: string
 */

export class PostCampaignRequestReq {
  @IsString()
  @IsOptional()
  product_id: string

  @IsEnum(CampaignRequestType, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      CampaignRequestType,
    ).join(', ')})`,
  })
  @IsOptional()
  type: CampaignRequestType

  @IsEnum(CampaignRequestStatus, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      CampaignRequestStatus,
    ).join(', ')})`,
  })
  @IsOptional()
  status: CampaignRequestStatus

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsString()
  @IsOptional()
  expired_at: string
}
