import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { StoreGroupService } from '../services/store-group.service'

/**
 * @oas [get] /store-group-cms/{id}
 * operationId: "GetListStoreGroupCms"
 * summary: "get list of store group cms"
 * description: "get list of store group cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Store Group.
 *   - (query) discount_id= {string} The ID of the Discount.
 *   - (query) limit=100 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of store group stores
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
 *              store_group_stores:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/store_group_stores"
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
const getStoreGroupDetailCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const storeGroupService: StoreGroupService =
    req.scope.resolve('storeGroupService')

  const { id } = req.params

  let discountId = undefined
  if (req.filterableFields.discount_id) {
    discountId = req.filterableFields.discount_id
  }
  delete req.listConfig.order
  const [store_group_stores, count] =
    await storeGroupService.getStoreGroupDetail(id, req.listConfig, discountId)

  res.status(200).json({ store_group_stores, count })
}

export default getStoreGroupDetailCmsController

export class GetStoreGroupDetailParams {
  @IsOptional()
  @IsString()
  discount_id?: string

  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number
}
