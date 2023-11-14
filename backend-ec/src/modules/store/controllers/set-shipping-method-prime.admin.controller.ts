/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import { FREE_SHIP_AMOUNT_DEF } from '../../../helpers/constant'
import { FulfillmentProvider } from '../../shipping/entities/fulfillment-provider.entity'
import { FulfillmentProviderService } from '../../shipping/services/fulfillment-provider.service'
import { ShippingOptionService } from '../../shipping/services/shipping-option.service'
import { ShippingProfileService } from '../../shipping/services/shipping-profile.service'
import { StorePlanType } from '../entity/store.entity'
import StoreService from '../services/store.service'

/**
 * @oas [get] /store/shipping/default
 * operationId: "SetShippingMethodDefault"
 * summary: "set shipping method default"
 * description: "Creates a store which can be associated with an logged in user."
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   201:
 *     description: Success
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
const setShippingMethodDefaultController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const manager = req.scope.resolve('manager') as EntityManager
  const storeService = req.scope.resolve('storeService') as StoreService

  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    'shippingOptionService',
  )

  const shippingProfileService: ShippingProfileService = req.scope.resolve(
    'shippingProfileService',
  )

  const fulfillmentProviderService: FulfillmentProviderService =
    req.scope.resolve('fulfillmentProviderService')

  await manager.transaction(async (transactionManager) => {
    const [stores, count] = await storeService
      .withTransaction(transactionManager)
      .listStoreCms({ plan_type: StorePlanType.PRIME }, req.listConfig)

    for (const store of stores) {
      const data = await shippingOptionService.list_(store.id)
      if (data || data.length > 0) {
        for (const i of data) {
          await shippingOptionService.delete_(i.id)
        }
      }
      const profile = await shippingProfileService
        .withTransaction(transactionManager)
        .retrieveDefault(store.id)

      let fulfillment = await fulfillmentProviderService
        .withTransaction(transactionManager)
        .retrieveTitle('宅急便')

      if (!fulfillment) {
        const data: DeepPartial<FulfillmentProvider> = {
          store_id: null,
          name: '宅急便コンパクト',
          is_installed: true,
          is_free: false,
          is_warranty: true,
          is_trackable: true,
          metadata: {
            sizes: [
              {
                id: '1',
                name: '-',
              },
            ],
          },
        }
        fulfillment = await fulfillmentProviderService.create(data)
      }

      const shippingOption = {
        store_id: store.id,
        provider_id: fulfillment.id,
        profile_id: profile.id,
        name: '宅急便',
        data: { all: 600, prefs: null },
        size_id: '1',
        is_trackable: true,
        is_warranty: true,
        provider: {
          id: fulfillment.id,
          name: '宅急便',
        },
      }

      await shippingOptionService
        .withTransaction(transactionManager)
        .save(store.id, shippingOption)

      if (store.free_ship_amount !== FREE_SHIP_AMOUNT_DEF) {
        await storeService
          .withTransaction(transactionManager)
          .setFreeShippingStore(store.id, FREE_SHIP_AMOUNT_DEF)
      }
    }
  })

  res.sendStatus(201)
}
export default setShippingMethodDefaultController

export class SetShippingOptionParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number
}
