import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import { Router } from 'medusa-extender'

import createShippingOptionController from './controllers/create-shipping-option.admin.controller'
import getFulfillmentPriceController, {
  GetFulfillmentPriceParams,
} from './controllers/get-fulfillment-price.admin.controller'
import getListProvidersController from './controllers/list-providers.admin.controller'
import getShippingOptionsController from './controllers/list-shipping-option.admin.controller'
import getShippingOptionsCmsController from './controllers/list-shipping-option.cms.admin.controller'
import updateShippingOptionController from './controllers/update-shipping-option.admin.controller'
@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/shipping-option',
      method: 'post',
      handlers: [wrapHandler(createShippingOptionController)],
    },
    {
      requiredAuth: true,
      path: '/admin/shipping-option',
      method: 'get',
      handlers: [wrapHandler(getShippingOptionsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/shipping-option/:id',
      method: 'put',
      handlers: [wrapHandler(updateShippingOptionController)],
    },
    {
      requiredAuth: true,
      path: '/admin/fulfillment-provider',
      method: 'get',
      handlers: [wrapHandler(getListProvidersController)],
    },
    {
      requiredAuth: true,
      path: '/admin/shipping-option/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getShippingOptionsCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/fulfillment-price',
      method: 'get',
      handlers: [
        transformQuery(GetFulfillmentPriceParams, {
          isList: true,
        }),
        wrapHandler(getFulfillmentPriceController),
      ],
    },
  ],
})
export class ShippingRouter {}
