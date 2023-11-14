import { ProductStatus } from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ProductSortService } from '../services/product-sort.service'

/**
 * @schema SortProductType
 * title: "SortProductType"
 * description: "Sort type"
 * x-resourceId: SortProductType
 * type: string
 * enum:
 *   - swap
 *   - prev
 *   - next
 *   - first
 *   - last
 */
export enum SortType {
  SWAP = 'swap',
  PREV = 'prev',
  NEXT = 'next',
  LAST = 'last',
  FIRST = 'first',
}

/**
 * @oas [post] /products/sort
 * operationId: "SortProducts"
 * summary: "Sort product"
 * description: "Sort product"
 * x-authenticated: true
 * requestBody:
 *   description: Sort product
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - type
 *           - ids
 *         properties:
 *           type:
 *             $ref: "#/components/schemas/SortProductType"
 *           limit:
 *             type: number
 *           ids:
 *             type: array
 *             items:
 *               type: string
 *           status:
 *               type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
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
 */
export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)
  const data = await validator(SortProductReq, req.body)
  const productSortService = req.scope.resolve<ProductSortService>(
    ProductSortService.resolutionKey,
  )

  if (!loggedInUser.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not a store already')
  }

  await productSortService.checkRankStore(data.ids)

  if (data.type === SortType.SWAP) {
    await productSortService.swapRank(data.ids, data.limit)
    res.sendStatus(200)
    return
  }

  await productSortService.updateRankPagination(
    loggedInUser.store_id,
    data.status as ProductStatus,
    data.type,
    data.ids,
    data.limit,
  )

  res.json(data)
}

export class SortProductReq {
  @IsArray()
  @IsString({ each: true })
  ids: string[]

  @IsNumber()
  @IsOptional()
  limit = 10

  @IsEnum(SortType, {
    always: true,
    message: `Invalid value (Sort type must be one of following values: ${Object.values(
      SortType,
    ).join(', ')})`,
  })
  type: SortType

  @IsEnum([ProductStatus.PUBLISHED, ProductStatus.PROPOSED], {
    always: true,
    message: `Invalid value (Status must be one of following values: ${Object.values(
      [ProductStatus.PUBLISHED, ProductStatus.PROPOSED],
    ).join(', ')})`,
  })
  status: string
}
