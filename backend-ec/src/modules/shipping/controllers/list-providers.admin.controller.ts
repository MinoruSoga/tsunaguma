import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { FulfillmentProviderService } from '../services/fulfillment-provider.service'

/**
 * @oas [get] /fulfillment-provider
 * operationId: "GetListFulfillmentProviders"
 * summary: "Get list fulfillment providers"
 * description: "Get list fulfillment providers"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - FufilmentProvider
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *              $ref: "#/components/schemas/fulfillment_provider"
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
const getListProvidersController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const providerService: FulfillmentProviderService = req.scope.resolve(
    'fulfillmentProviderService',
  )

  const providers = await providerService.list({
    where: { is_show: true },
    order: { rank: 'ASC' },
  })

  res.json(providers)
}

export default getListProvidersController
