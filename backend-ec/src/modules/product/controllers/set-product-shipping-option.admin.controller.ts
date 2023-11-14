/* eslint-disable @typescript-eslint/no-unused-vars */
import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import { ShippingOptionService } from '../../../modules/shipping/services/shipping-option.service'
import { FulfillmentProvider } from '../../shipping/entities/fulfillment-provider.entity'
import { FulfillmentProviderService } from '../../shipping/services/fulfillment-provider.service'
import { ShippingProfileService } from '../../shipping/services/shipping-profile.service'
import { StorePlanType } from '../../store/entity/store.entity'
import StoreService from '../../store/services/store.service'
import { GiftCoverEnum } from '../entity/product.entity'
import { ProductService } from '../services/product.service'

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
const setProductShippingMethodDefaultController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const manager = req.scope.resolve('manager') as EntityManager
  const storeService = req.scope.resolve('storeService') as StoreService

  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    'shippingOptionService',
  )

  const productService: ProductService = req.scope.resolve('productService')

  await manager.transaction(async (transactionManager) => {
    const [stores, count] = await storeService
      .withTransaction(transactionManager)
      .listStoreCms({ plan_type: StorePlanType.PRIME }, req.listConfig)

    for (const store of stores) {
      const data = await shippingOptionService.list_(store.id)

      const products = await productService.listByStore_(store.id)

      for (const product of products) {
        for (let index = 0; index < data.length; index++) {
          await productService.update(product.id, {
            shipping_options: [{ id: data[index].id }],
            is_maker_ship: product.is_maker_ship,
            is_customizable: product.is_customizable,
            title: product.title,
            is_giftcard: product.is_giftcard,
            discountable: product.discountable,
            gift_cover: product.gift_cover as GiftCoverEnum,
          })
        }
      }
    }
  })

  res.sendStatus(201)
}
export default setProductShippingMethodDefaultController

export class SetProductShippingOptionParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  order?: string

  @IsOptional()
  offset?: number
}
