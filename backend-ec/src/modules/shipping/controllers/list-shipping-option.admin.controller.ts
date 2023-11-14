import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { ShippingOptionService } from '../services/shipping-option.service'
import { LoggedInUser } from './../../../interfaces/loggedin-user'

/**
 * @oas [get] /shipping-option
 * operationId: "GetStoreShippingOptions"
 * summary: "List Shipping Addons"
 * description: "Retrieves a list of Shipping options of a Store"
 * x-authenticated: true
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
const getShippingOptionsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    'shippingOptionService',
  )
  const shippingOptions = await shippingOptionService.list_(
    loggedInUser.store_id,
  )

  res.json(shippingOptions)
}

export default getShippingOptionsController
