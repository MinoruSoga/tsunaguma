import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { DiscountService } from '../services/discount.service'

/**
 * @oas [delete] /discount/{id}/cms
 * operationId: "DeleteDiscountsCms"
 * summary: "Delete a Discount Cms"
 * description: "Deletes a Discount Cms."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Discount
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Discount
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
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const discount_id = req.params.id

  const discountService: DiscountService = req.scope.resolve('discountService')
  const manager: EntityManager = req.scope.resolve('manager')
  await manager.transaction(async (transactionManager) => {
    return await discountService
      .withTransaction(transactionManager)
      .delete(discount_id)
  })

  res.sendStatus(200)
}
