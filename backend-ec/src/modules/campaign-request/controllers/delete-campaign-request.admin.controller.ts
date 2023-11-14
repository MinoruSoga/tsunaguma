import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { CampaignRequestService } from '../service/campaign-request.service'

/**
 * @oas [delete] /campaign-request/{id}
 * operationId: "DeleteCampaignRequest"
 * summary: "delete campaign request"
 * description: "delete campaign request"
 * parameters:
 *   - (path) id=* {string} The ID of the Campaign request.
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - CampaignRequest
 * responses:
 *   200:
 *     description: Ok
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
  const campaignRequestService = req.scope.resolve<CampaignRequestService>(
    CampaignRequestService.resolutionKey,
  )

  const id = req.params.id

  await campaignRequestService.delete(id)

  res.status(200).json('success')
}
