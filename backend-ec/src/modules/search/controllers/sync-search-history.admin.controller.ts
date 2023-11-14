import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { SearchHistoryService } from '../services/search-history.service'

/**
 * @oas [post] /search-history/sync
 * operationId: "SyncSearchHistory"
 * summary: "sync search history"
 * description: "sync search history"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *          - tmp_user_id
 *         properties:
 *            tmp_user_id:
 *             type: string
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - SearchHistory
 * responses:
 *   "200":
 *     description: OK
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
export default async function (req: MedusaRequest, res: Response) {
  const data = await validator(AddSearchHistoryReq, req.body)
  const searchHistoryService = req.scope.resolve<SearchHistoryService>(
    SearchHistoryService.resolutionKey,
  )
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)

  await searchHistoryService.sync(data.tmp_user_id, loggedInUser.id)

  res.json(data)
}

export class AddSearchHistoryReq {
  @IsString()
  tmp_user_id: string
}
