import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { StoreBusinessForm } from '../../store/entity/store.entity'
import StoreService from '../../store/services/store.service'
import { StoreDetailService } from '../../store/services/store-detail.service'

/**
 * @oas [get] /users/detail
 * operationId: "GetUserDetail"
 * summary: "Retrieve detail of user"
 * description: "Retrieve detail of user"
 * x-authenticated: true
 * tags:
 *   - User
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/store_detail"
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
export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  const storeDetailService = req.scope.resolve(
    StoreDetailService.resolutionKey,
  ) as StoreDetailService

  const storeService = req.scope.resolve('storeService') as StoreService

  const result = await storeDetailService.retrieveByUser(loggedInUser.id, false)

  if (result) {
    const store = await storeService.retrieve_(
      result.id,
      {
        select: ['business_form'],
      },
      false,
    )

    result.business_form = !store
      ? StoreBusinessForm.INDIVIDUAL
      : store.business_form
  }

  res.json(result)
}
