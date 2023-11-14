/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EventBusService } from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsBoolean, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { SearchService } from 'medusa-interfaces'

import { ProductService } from '../../product/services/product.service'
import { ProductSearchService } from '../services/product-search.service'

/**
 * @oas [post] /search/reset/stores
 * operationId: "StoreResetSearch"
 * summary: "store reset search"
 * description: "store reset search"
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/ResetSearchStoresReq"
 * x-authenticated: false
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Search
 * responses:
 *   "200":
 *    description: OK
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
  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService
  const searchService = req.scope.resolve<SearchService>('searchService')
  const data = await validator(ResetSearchStoresReq, req.body)

  if (data.clear_all) {
    await searchService.deleteAllDocuments(ProductService.CUSTOM_INDEX_NAME)
  }

  await eventBusService.emit(ProductSearchService.TNG_SEARCH_INDEX_EVENT, {})

  res.sendStatus(200)
}

/**
 * @schema ResetSearchStoresReq
 * title: "ResetSearchStoresReq"
 * description: "Reset Search Stores Req"
 * x-resourceId: ResetSearchStoresReq
 * type: object
 * properties:
 *   clear_all:
 *     description: "true"
 *     type: boolean
 */
class ResetSearchStoresReq {
  @IsBoolean()
  @IsOptional()
  clear_all?: boolean
}
