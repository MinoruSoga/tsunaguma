import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../user/constant'
import { CampaignRequestService } from '../service/campaign-request.service'

/**
 * @oas [get] /campaign-request
 * operationId: "GetCampaignRequestStore"
 * summary: "get campaign request store"
 * description: "get campaign request store"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - CampaignRequest
 * responses:
 *   200:
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          required:
 *            - campaign_requests
 *            - created_at
 *          properties:
 *             campaign_requests:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/campaign_request"
 *             created_at:
 *               type: string
 *               description: "The date with timezone at which the resource was created."
 *               format: date-time
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
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const isUserAdmin = isAdmin(loggedInUser)

  if (isUserAdmin) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, 'Unauthorized')
  }

  if (!loggedInUser?.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store')
  }

  const result = await campaignRequestService.retrieveByStore(
    loggedInUser.store_id,
  )

  const created_at = await campaignRequestService.decorateByStore(
    loggedInUser.store_id,
  )

  res.status(200).json({ campaign_requests: result, created_at })
}
