import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaRequest } from 'medusa-extender'

import { User } from '../../user/entity/user.entity'
import { StorePlanType } from '../entity/store.entity'
import StoreService from '../services/store.service'
/**
 * @oas [get] /stores
 * operationId: "ListStore"
 * summary: "List of store"
 * description: "List of store"
 * x-authenticated: false
 * parameters:
 *   - (query) fields {string} (Comma separated) Which fields should be included in each products of the result.
 *   - (query) limit {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of products
 *   - (query) order {string} The order of products
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each product of the result.
 *   - (query) name {string} The name of store
 *   - in: query
 *     name: plan_type
 *     required: false
 *     schema:
 *       $ref: "#/components/schemas/StorePlanTypeEnum"
 * tags:
 *   - Store
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  count:
 *                    type: integer
 *                  stores:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/store"
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
const listStoreController = async (req: MedusaRequest, res: Response) => {
  const storeService: StoreService = req.scope.resolve('storeService')

  req.listConfig?.take === 50 ? delete req.listConfig.take : ''

  const [stores, count] = await storeService.listAndCount(
    req.filterableFields,
    req.listConfig,
  )

  stores.forEach((store) => {
    store.owner = _.pick(store.owner, defaultStoreOwnerFields) as User
  })

  res.status(200).json({ stores, count })
}

export class GetListStoreParams {
  @IsString()
  @IsOptional()
  fields?: string

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number

  @IsString()
  @IsOptional()
  expand?: string

  @IsOptional()
  @IsString()
  order?: string

  @IsOptional()
  @IsEnum(StorePlanType, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      StorePlanType,
    ).join(', ')})`,
  })
  plan_type?: StorePlanType

  @IsString()
  @IsOptional()
  name?: string
}

export const defaultStoreFields = [
  'id',
  'name',
  'plan_type',
  'status',
  'owner_id',
  'store_detail_id',
  'slug',
  'avatar',
  'free_ship_amount',
  'display_id',
  'created_at',
]
export const defaultStoreOwnerFields = [
  'id',
  'email',
  'first_name',
  'last_name',
  'nickname',
  'type',
]
export const defaultStoreRelations = ['owner', 'store_detail']

export default listStoreController
