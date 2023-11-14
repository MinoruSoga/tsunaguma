import { ReturnStatus } from '@medusajs/medusa'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { OriginEnum } from '../entities/return.entity'
import { ReturnSearchService } from '../service/return-search.service'
import {
  ReturnItemsCmsRes,
  ReturnStoreCmsRes,
} from './search-return.cms.admin.controller'

/**
 * @oas [get] /return/{id}
 * operationId: "GetReturnDetailCms"
 * summary: "get return detail cms"
 * description: "get return detail cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Return.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Return
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ReturnDetailCmsRes"
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
const getReturnDetailCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const id = req.params.id
  const returnSearchService: ReturnSearchService = req.scope.resolve(
    'returnSearchService',
  )

  const result = await returnSearchService.retrieve(id)

  res.status(200).json(result)
}

export default getReturnDetailCmsController

/**
 * @schema ReturnCustomerCmsRes
 * title: "Return Customer Cms Res"
 * description: "Return Customer Cms Res"
 * x-resourceId: ReturnCustomerCmsRes
 * properties:
 *  id:
 *    type: string
 *  name:
 *    type: string
 *  display_id:
 *    type: number
 */

export type ReturnCustomerCmsRes = {
  id?: string
  nickname?: string
  display_id?: number
}

/**
 * @schema ReturnOrderDetailCmsRes
 * title: "Return order cms res"
 * description: "Return order cms res"
 * x-resourceId: ReturnOrderDetailCmsRes
 * properties:
 *  id:
 *    type: string
 *  created_at:
 *    type: string
 *  display_id:
 *    type: number
 *  store:
 *    $ref: "#/components/schemas/ReturnStoreCmsRes"
 *  customer:
 *    $ref: "#/components/schemas/ReturnCustomerCmsRes"
 */

export type ReturnOrderDetailCmsRes = {
  id?: string
  display_id?: number
  created_at?: Date
  store?: ReturnStoreCmsRes
  customer?: ReturnCustomerCmsRes
}

/**
 * @schema ReturnDetailCmsRes
 * title: "Return detail cms res"
 * description: "Return detail cms res"
 * x-resourceId: ReturnDetailCmsRes
 * properties:
 *  id:
 *    type: string
 *  created_at:
 *    type: string
 *  display_id:
 *    type: number
 *  status:
 *    description: "Status of the Return."
 *    type: string
 *    enum:
 *      - requested
 *      - received
 *      - requires_action
 *      - canceled
 *  items:
 *    type: array
 *    items:
 *      $ref: "#/components/schemas/ReturnItemsCmsRes"
 *  order:
 *    $ref: "#/components/schemas/ReturnOrderDetailCmsRes"
 *  origin:
 *    $ref: "#/components/schemas/OriginEnum"
 *  reason:
 *    type: string
 *  is_pause:
 *    type: boolean
 */

export type ReturnDetailCmsRes = {
  id?: string
  display_id?: number
  created_at?: string
  status?: ReturnStatus
  items?: ReturnItemsCmsRes[]
  order?: ReturnOrderDetailCmsRes
  origin?: OriginEnum
  reason?: string
  is_pause?: boolean
}
