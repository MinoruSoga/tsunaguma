import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { ReturnDeliveryService } from '../service/return-delivery.service'

/**
 * @oas [get] /return-delivery/{id}/products
 * operationId: "GetProductsReturnDelivery"
 * summary: "Get Products Return Delivery"
 * description: "Get Products Return Delivery"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of store
 * tags:
 *   - ReturnDelivery
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  products:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/product"
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
 *
 */
const listProductsReturnDeliveryController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const returnDeliveryService: ReturnDeliveryService = req.scope.resolve(
    ReturnDeliveryService.resolutionKey,
  )

  const { id } = req.params
  const products = await returnDeliveryService.listProduct(id)

  res.status(200).json({ products })
}

export default listProductsReturnDeliveryController
