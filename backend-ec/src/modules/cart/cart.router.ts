import {
  defaultStoreCartFields,
  defaultStoreCartRelations,
} from '@medusajs/medusa'
import { transformBody } from '@medusajs/medusa/dist/api/middlewares'
import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import createPaymentSessionsController from '@medusajs/medusa/dist/api/routes/store/carts/create-payment-sessions'
import getCartController from '@medusajs/medusa/dist/api/routes/store/carts/get-cart'
import setPaymentSessionsController from '@medusajs/medusa/dist/api/routes/store/carts/set-payment-session'
import updateCartController from '@medusajs/medusa/dist/api/routes/store/carts/update-cart'
import { FindParams } from '@medusajs/medusa/dist/types/common'
import { Router } from 'medusa-extender'

import { defaultAdminDiscountsRelations } from '../discount/discount.router'
import addCartShippingMethodsStoreController from './controllers/add-cart-shipping-methods.admin.controller'
import authorizeCartPaymentStoreController from './controllers/authorize-cart-payment.admin.controller'
import completeCartAdminController from './controllers/complete-cart.admin.controller'
import createCartStoreController from './controllers/create-cart.store.controller'
import deleteLineItemsCms from './controllers/delete-line-item.cms.admin.controller'
import listCouponAvailable, {
  ListCouponAvailableParams,
} from './controllers/get-coupon-available-cart.admin.controller'
import listItemsByStore, {
  GetListItemsbyStoreParams,
} from './controllers/get-items-store.admin.controller'
import getLineItemShippingOptionController from './controllers/get-line-item-shipping-options.store.controller'
import getStoreFreeShippingLeftAdminController from './controllers/get-store-free-shipping-left.admin.controller'
import sanitizeCartStoreController from './controllers/sanitize-cart.store.controller'
import sanitizeDiscountCartAdminController from './controllers/sanitize-discount-cart.admin.controller'
import syncCartCustomer from './controllers/sync-cart-customer.admin.controller'
import { ExtendedStorePostCartsCartReq } from './controllers/update-cart.admin.controller'
import updateLineItemController from './controllers/update-line-item.store.controller'
import upsertCartDiscountAdminController from './controllers/upsert-cart-discount.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: false,
      path: '/store/carts/:id/line-items/:line_id',
      method: 'post',
      handlers: [wrapHandler(updateLineItemController)],
    },
    {
      requiredAuth: false,
      path: '/store/carts/:id/line-items/:line_id/shipping-options',
      method: 'get',
      handlers: [wrapHandler(getLineItemShippingOptionController)],
    },
    {
      requiredAuth: true,
      path: '/admin/carts/:id/shipping-methods',
      method: 'post',
      handlers: [wrapHandler(addCartShippingMethodsStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/list-items',
      method: 'get',
      handlers: [
        transformQuery(GetListItemsbyStoreParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(listItemsByStore),
      ],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/carts/:id/authorize',
      handlers: [wrapHandler(authorizeCartPaymentStoreController)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/carts/:id',
      handlers: [
        transformBody(ExtendedStorePostCartsCartReq),
        wrapHandler(updateCartController),
      ],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/carts/:id/complete',
      handlers: [wrapHandler(completeCartAdminController)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/carts/:id/sync',
      handlers: [wrapHandler(syncCartCustomer)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/carts/:id/payment-sessions',
      handlers: [wrapHandler(createPaymentSessionsController)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/carts/:id/payment-session',
      handlers: [wrapHandler(setPaymentSessionsController)],
    },
    {
      requiredAuth: true,
      method: 'delete',
      path: '/admin/line-item/:id',
      handlers: [wrapHandler(deleteLineItemsCms)],
    },
    {
      requiredAuth: false,
      path: '/admin/carts/:id/free-shipping/:store_id',
      method: 'get',
      handlers: [wrapHandler(getStoreFreeShippingLeftAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/carts/:id/discount',
      method: 'post',
      handlers: [wrapHandler(upsertCartDiscountAdminController)],
    },
    {
      requiredAuth: false,
      path: '/store/carts/:id',
      handlers: [
        transformQuery(FindParams, {
          defaultRelations: defaultStoreCartRelations.concat([
            'items.line_item_addons',
            'items.line_item_addons.lv1',
            'items.line_item_addons.lv2',
          ]),
          defaultFields: defaultStoreCartFields,
          isList: false,
        }),
        wrapHandler(getCartController),
      ],
      method: 'get',
    },
    {
      requiredAuth: false,
      method: 'post',
      path: '/store/carts/:id/sanitize',
      handlers: [wrapHandler(sanitizeCartStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/discounts/:id/coupon',
      method: 'get',
      handlers: [
        transformQuery(ListCouponAvailableParams, {
          isList: true,
          defaultLimit: 10,
          defaultRelations: defaultAdminDiscountsRelations,
        }),
        wrapHandler(listCouponAvailable),
      ],
    },
    {
      requiredAuth: false,
      method: 'post',
      path: '/admin/carts/:id/sanitize/discount',
      handlers: [wrapHandler(sanitizeDiscountCartAdminController)],
    },
    {
      requiredAuth: false,
      method: 'post',
      path: '/store/carts',
      handlers: [wrapHandler(createCartStoreController)],
    },
  ],
})
export class CartRouter {}
