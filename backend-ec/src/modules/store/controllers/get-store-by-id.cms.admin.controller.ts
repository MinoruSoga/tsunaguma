import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import StoreService from '../services/store.service'

/**
 * @oas [get] /store/{id}/cms
 * operationId: "GetStoreByIdCms"
 * summary: "Get a Store By Id cms"
 * description: "Get a Store By Id cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The id of store.
 *   - (query) user_id={string} The id of user
 *   - (query) fields {string} (Comma separated) Which fields should be included in each store of the result.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *           $ref: "#/components/schemas/store"
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
const getStoreByIdCms = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const storeService = req.scope.resolve('storeService') as StoreService
  const { id } = req.params

  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.id = id

  const store = await storeService.getStoreById(
    req.filterableFields as any,
    req.retrieveConfig,
  )
  res.status(200).json(store)
}

export default getStoreByIdCms

export class GetStoreByIdCmsParams {
  @IsString()
  @IsOptional()
  fields?: string

  @IsString()
  @IsOptional()
  user_id: string
}
