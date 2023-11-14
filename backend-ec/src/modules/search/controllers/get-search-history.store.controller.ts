import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { SearchHistoryService } from '../services/search-history.service'

/**
 * @oas [get] /search-history
 * operationId: "GetSearchHistory"
 * summary: "get search history"
 * description: "get search history"
 * x-authenticated: false
 * parameters:
 *   - (query) limit=15 {integer} The number record of a page
 *   - (query) offset=0 {integer} The number of follower to skip before starting to collect the follower set
 *   - (query) tmp_user_id {string} tmp user id
 *   - (query) user_id {string} user id
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - SearchHistory
 * responses:
 *   "200":
 *    description: OK
 *    content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/search_history'
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
  const searchHistoryService = req.scope.resolve<SearchHistoryService>(
    SearchHistoryService.resolutionKey,
  )

  const result = await searchHistoryService.list(
    req.filterableFields,
    req.listConfig,
  )

  res.json(result)
}

export class GetSearchHistoryReq {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit = 15

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset = 0

  @IsOptional()
  @IsString()
  tmp_user_id: string

  @IsOptional()
  @IsString()
  user_id: string
}
