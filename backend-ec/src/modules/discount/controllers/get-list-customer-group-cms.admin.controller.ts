import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { DiscountService } from '../services/discount.service'

/**
 * @oas [get] /customer-group-cms/{id}
 * operationId: "GetListCustomerGroupCms"
 * summary: "get list of customer group cms"
 * description: "get list of customer group cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Customer Group.
 *   - (query) discount_id= {string} The ID of the Discount.
 *   - (query) limit=100 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of customer group customers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Discount
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: object
 *          properties:
 *              count:
 *                type: integer
 *              customer_group_customers:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/customer_group_customers"
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
const getCustomerGroupDetailCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const discountService: DiscountService = req.scope.resolve('discountService')

  const { id } = req.params
  delete req.listConfig.order

  let discountId = undefined
  if (req.filterableFields.discount_id) {
    discountId = req.filterableFields.discount_id
  }
  const [customer_group_customers, count] =
    await discountService.getCustomerGroupDetail(id, req.listConfig, discountId)

  res.status(200).json({ customer_group_customers, count })
}

export default getCustomerGroupDetailCmsController

export class GetCustomerGroupDetailParams {
  @IsOptional()
  @IsString()
  discount_id?: string

  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}
