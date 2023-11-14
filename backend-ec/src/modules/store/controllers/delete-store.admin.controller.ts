import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import StoreService from '../services/store.service'

/**
 * @oas [delete] /stores/{id}
 * operationId: "deleteStoreById"
 * summary: "Delete a Store"
 * description: "Deletes a Store and it's associated Store Variants."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Store.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   "200":
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
const deleteStoreAdminController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params

  const storeService: StoreService = req.scope.resolve('storeService')
  const manager: EntityManager = req.scope.resolve('manager')
  await manager.transaction(async (transactionManager) => {
    return await storeService
      .withTransaction(transactionManager)
      .deleteStore(id)
  })

  res.sendStatus(200)
}

export default deleteStoreAdminController
