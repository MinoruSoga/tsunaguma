import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsString, ValidateNested } from 'class-validator'
import { Request, Response } from 'express'
import { EntityManager } from 'typeorm'

import { StoreGroupService } from '../../services/store-group.service'

/**
 * @oas [post] /store-groups/{id}/batch
 * operationId: "PostStoreGroupsBatch"
 * summary: "Add Stores"
 * description: "Adds a list of stores, represented by id's, to a stores group."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the store group.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - store_ids
 *         properties:
 *           store_ids:
 *             description: "The ids of the store to add"
 *             type: array
 *             items:
 *               required:
 *                 - id
 *               properties:
 *                 id:
 *                   description: ID of the customer
 *                   type: string
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS Client
 *     source: |
 *       import Medusa from "@medusajs/medusa-js"
 *       const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
 *       // must be previously logged in or use api token
 *       medusa.admin.customerGroups.addCustomers(customer_group_id, {
 *         customer_ids: [
 *           {
 *             id: customer_id
 *           }
 *         ]
 *       })
 *       .then(({ customer_group }) => {
 *         console.log(customer_group.id);
 *       });
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl --location --request POST 'https://medusa-url.com/admin/customer-groups/{id}/customers/batch' \
 *       --header 'Authorization: Bearer {api_token}' \
 *       --header 'Content-Type: application/json' \
 *       --data-raw '{
 *           "customer_ids": [
 *               {
 *                   "id": "cus_01G2Q4BS9GAHDBMDEN4ZQZCJB2"
 *               }
 *           ]
 *       }'
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Customer Group
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             customer_group:
 *               $ref: "#/components/schemas/store_group"
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

export default async (req: Request, res: Response) => {
  const { id } = req.params
  const validated = await validator(AdminPostStoreGroupBatchReq, req.body)

  const storeGroupService: StoreGroupService =
    req.scope.resolve('storeGroupService')

  const manager: EntityManager = req.scope.resolve('manager')

  const store_group = await manager.transaction(async (transactionManager) => {
    return await storeGroupService
      .withTransaction(transactionManager)
      .addStores(
        id,
        validated.store_ids.map(({ id }) => id),
      )
  })

  res.status(200).json({ store_group })
}

export class AdminPostStoreGroupBatchReq {
  @ValidateNested({ each: true })
  @Type(() => CustomerGroupsBatchStore)
  store_ids: CustomerGroupsBatchStore[]
}

export class CustomerGroupsBatchStore {
  @IsString()
  id: string
}
