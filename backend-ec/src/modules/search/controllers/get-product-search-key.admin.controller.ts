import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { ProductSearchService } from '../services/product-search.service'

/**
 * @oas [get] /search/product-key
 * operationId: "GetSearchApiKey"
 * summary: "Get an api key to search product"
 * description: "Retrieve a an api key for searching."
 * x-authenticated: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Search
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          type: object
 *          $ref: "#/components/schemas/MeiliSearchKey"
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
const getProductSearchKeyController = async (
  req: MedusaRequest,
  res: Response,
) => {
  const searchService: ProductSearchService = req.scope.resolve(
    'productSearchService',
  )
  const keys = await searchService.getSearchKeys()
  const clientKey = keys.results.find((key) => key.actions.includes('search'))

  if (!clientKey) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Can not found any client key',
    )
  }

  res.json(clientKey)
}

export default getProductSearchKeyController

/**
 * @schema MeiliSearchKey
 * title: "MeiliSearchKey"
 * description: "MeiliSearchKey"
 * x-resourceId: MeiliSearchKey
 * type: object
 * required:
 *   - uid
 *   - actions
 *   - indexes
 *   - expiresAt
 *   - key
 *   - createdAt
 *   - updatedAt
 * properties:
 *   uid:
 *     type: string
 *   actions:
 *     type: array
 *     items:
 *       type: string
 *   indexes:
 *     type: array
 *     items:
 *       type: string
 *   key:
 *       type: string
 *   createdAt:
 *     type: string
 *     format: date-time
 *   updatedAt:
 *     type: string
 *     format: date-time
 *   expiresAt:
 *     type: string
 *     format: date-time
 */
