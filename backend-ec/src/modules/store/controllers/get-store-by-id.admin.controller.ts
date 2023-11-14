import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { In } from 'typeorm'

import { StoreStatus } from '../entity/store.entity'
import StoreService from '../services/store.service'

/**
 * @oas [get] /store/{id}
 * operationId: "GetStoreById"
 * summary: "Get a Store By Id"
 * description: "Get a Store By Id"
 * x-authenticated: false
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
const getStoreById = async (req: MedusaRequest, res: Response) => {
  const storeService = req.scope.resolve('storeService') as StoreService
  const { id } = req.params
  const allowStoreStatuses = [StoreStatus.APPROVED, StoreStatus.STOPPED]

  req.filterableFields = req.filterableFields ?? {}
  req.filterableFields.id = id
  req.filterableFields.status = In(allowStoreStatuses)

  const store = await storeService.getStoreById(
    req.filterableFields as any,
    req.retrieveConfig,
  )
  res.status(200).json(store)
}

export default getStoreById

export class GetStoreByIdParams {
  @IsString()
  @IsOptional()
  fields?: string

  @IsString()
  @IsOptional()
  user_id: string
}
