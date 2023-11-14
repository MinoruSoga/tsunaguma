import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import { ProductHistoryService } from '../../services/product-history.service'

/**
 * @oas [get] /product/{id}/histories
 * operationId: "GetProductHistory"
 * summary: "list All Product hsitory."
 * description: "Retrieve a list of Product history."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product.
 *   - (query) fields {string} (Comma separated) Which fields should be included in each products of the result.
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
 *   - (query) order {string} The order of products
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each product of the result.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             histories:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/product_history"
 *             count:
 *               type: integer
 *               description: The total number of items available
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

const productHistory = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const productHistoryService = req.scope.resolve(
    'productHistoryService',
  ) as ProductHistoryService

  const { id } = req.params

  const [histories, count] = await productHistoryService.listHistory(
    id,
    req.listConfig,
  )
  res.status(200).json({ histories, count })
}
export default productHistory

export class GetProductHistoryCmsParams {
  @IsString()
  @IsOptional()
  fields?: string

  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number

  @IsString()
  @IsOptional()
  expand?: string
}

export const defaultProductHistoryFields = [
  'id',
  'product_id',
  'user_id',
  'created_at',
  'metadata',
]
