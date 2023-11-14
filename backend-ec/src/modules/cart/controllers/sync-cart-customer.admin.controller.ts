import {
  defaultStoreCartFields,
  defaultStoreCartRelations,
} from '@medusajs/medusa'
import { FlagRouter } from '@medusajs/medusa/dist/utils/flag-router'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { LineItem } from '../entity/line-item.entity'
import { CartService } from '../services/cart.service'
import { LineItemService } from '../services/line-item.service'

/**
 * @oas [post] /carts/{id}/sync
 * operationId: SyncCartWithCustomer
 * summary: Sync cart with customer
 * description: "Sync cart with customer."
 * parameters:
 *   - (path) id=* {string} The ID of the Cart.
 * tags:
 *   - Cart
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             cart:
 *               $ref: "#/components/schemas/cart"
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

const syncCartCustomer = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve<LoggedInUser>(LOGGED_IN_USER_KEY)

  const cartService: CartService = req.scope.resolve('cartService')
  const lineItemService: LineItemService = req.scope.resolve('lineItemService')
  const manager: EntityManager = req.scope.resolve('manager')
  const featureFlagRouter: FlagRouter = req.scope.resolve('featureFlagRouter')

  const cartId = req.params.id

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const cart = await cartService.retriveCartWithCustomer(
    cartId,
    loggedInUser.id,
  )

  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart with id: ${cartId} not exists!`,
    )
  }

  const { id, data } = await cartService.syncCartWithCustomer(
    loggedInUser.id,
    cartId,
  )

  if (data?.length > 0 && cartId !== id) {
    await Promise.all(
      data.map(async (e) => {
        await manager.transaction(async (m) => {
          const txCartService = cartService.withTransaction(m)
          const cart = await txCartService.retrieve(id)

          const line = (await lineItemService
            .withTransaction(m)
            .generate(e.variant_id, cart.region_id, e.quantity, {
              customer_id: loggedInUser.id || cart.customer_id,
              metadata: e.metadata,
            })) as LineItem

          await txCartService.addLineItem(id, line, {
            validateSalesChannels:
              featureFlagRouter.isFeatureEnabled('sales_channels'),
          })

          const updated = await txCartService.retrieve(id, {
            relations: ['payment_sessions'],
          })

          if (updated.payment_sessions?.length) {
            await txCartService.setPaymentSessions(id)
          }
        })
      }),
    )
  }

  const result = await cartService.retrieveWithTotals(id, {
    select: defaultStoreCartFields,
    relations: defaultStoreCartRelations,
  })

  res.status(200).json({ cart: result })
}
export default syncCartCustomer
