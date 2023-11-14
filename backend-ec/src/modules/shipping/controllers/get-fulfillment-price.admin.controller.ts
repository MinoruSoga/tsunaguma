import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { FulfillmentPriceService } from '../services/fulfillment-price.service'

/**
 * @oas [get] /fulfillment-price
 * operationId: "GetFulfillmentPrices"
 * summary: "Get  fulfillment prices"
 * description: "Get  fulfillment prices"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * parameters:
 *   - (query) provider_id=* {string} Id of provider
 *   - (query) size= {string} Id of size
 *   - (query) from_pref_id= {string} Id of from prefecture
 *   - (query) expand= {string} (Comma separated) Which fields should be expanded in each product of the result.
 * tags:
 *   - FufillmentPrice
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *            type: object
 *            properties:
 *                prices:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/fulfillment_price"
 *                total:
 *                  type: integer
 *                  description: count result
 *
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

const getFulfillmentPriceController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const providerService: FulfillmentPriceService = req.scope.resolve(
    'fulfillmentPriceService',
  )

  const [result, total] = await providerService.getFulfillmentPrice(
    req.filterableFields,
    req.listConfig,
  )

  res.send({
    prices: result,
    total,
  })
}

export class GetFulfillmentPriceParams {
  @IsString()
  @IsNotEmpty()
  provider_id: string

  @IsString()
  @IsOptional()
  size: string

  @IsString()
  @IsOptional()
  from_pref_id: string

  @IsString()
  @IsOptional()
  expand: string
}
export default getFulfillmentPriceController
