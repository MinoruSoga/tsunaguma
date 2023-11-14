import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { SearchHistoryService } from '../services/search-history.service'

/**
 * @oas [post] /search-history
 * operationId: "AddSearchHistory"
 * summary: "add search history"
 * description: "add search history"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AddSearchHistoryReq"
 * x-authenticated: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - SearchHistory
 * responses:
 *   "201":
 *     description: Created
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

  if (!data.tmp_user_id && !data.user_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Temp user id or user id is required !',
    )
  }

  await searchHistoryService.create(data)

  res.sendStatus(201)
}

/**
 * @schema AddSearchHistoryReq
 * title: "AddSearchHistoryReq"
 * description: "Add Search History Req"
 * x-resourceId: AddSearchHistoryReq
 * type: object
 * required:
 *   - content
 * properties:
 *   content:
 *     description: "Search content"
 *     type: string
 *   tmp_user_id:
 *     description: "Uuid"
 *     type: string
 *   user_id:
 *     description: "Id if user"
 *     type: string
 */

export class AddSearchHistoryReq {
  @IsOptional()
  @IsString()
  tmp_user_id: string

  @IsOptional()
  @IsString()
  user_id: string

  @IsString()
  content: string
}
