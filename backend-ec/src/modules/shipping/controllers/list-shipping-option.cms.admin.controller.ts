import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ShippingOptionService } from '../services/shipping-option.service'

/**
 * @oas [get] /shipping-option/{id}/cms
 * operationId: "GetShippingOptionsByStore"
 * summary: "List Shipping Option By Store"
 * description: "Retrieves a list of Shipping options of a Store"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Store.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - ShippingOption
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *              $ref: "#/components/schemas/shipping_option"
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
const getShippingOptionsCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params
  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    'shippingOptionService',
  )
  const shippingOptions = await shippingOptionService.list_(id)

  res.json(shippingOptions)
}

export default getShippingOptionsCmsController
