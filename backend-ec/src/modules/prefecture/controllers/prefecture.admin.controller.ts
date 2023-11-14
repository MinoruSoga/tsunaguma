import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import loadConfig from '../../../helpers/config'
import { Prefecture } from '../entity/prefecture.entity'
import { PrefectureService } from '../services/prefecture.service'
import { CacheService } from './../../cache/cache.service'

/**
 * @oas [get] /prefecture
 * operationId: "GetPrefectures"
 * summary: "List Product Prefectures"
 * description: "Retrieves a list of Prefectures"
 * x-authenticated: false
 * parameters:
 *   - (query) areaId= {string} The parent_id of pref.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Prefecture
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/prefecture"

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
const getAllPrefecturesController = async (
  req: MedusaRequest,
  res: Response,
) => {
  const areaId = req.query.areaId as string
  const prefService = req.scope.resolve(
    PrefectureService.resolutionKey,
  ) as PrefectureService
  const cacheService = req.scope.resolve<CacheService>(
    CacheService.resolutionKey,
  )
  const config = loadConfig()

  const cacheKey = config.cache.prefectures(areaId)
  let prefs = await cacheService.get<Prefecture[]>(cacheKey)
  if (!prefs) {
    prefs = await prefService.list(areaId)
    await cacheService.set(cacheKey, prefs)
  }

  res.send(prefs)
}

export default getAllPrefecturesController
