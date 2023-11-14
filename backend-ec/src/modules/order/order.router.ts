/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  allowedAdminOrdersFields,
  defaultAdminOrdersFields,
} from '@medusajs/medusa'
import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import requestReturnAdminController from '@medusajs/medusa/dist/api/routes/admin/orders/request-return'
import { Router } from 'medusa-extender'

import chageOrderFulfillmentStatus from './controllers/change-order-ship-status.admin.controller'
import closeCancelRequestController from './controllers/close-cancel-request.admin.controller'
import GetBillingStore, {
  GetBillingByStoreParams,
} from './controllers/get-billing-store.admin.controller'
import getListOrderCms from './controllers/get-list-order.cms.admin.controller'
import getListOrderBilling, {
  GetListOrderBillingParams,
} from './controllers/get-list-order-billing.admin.controller'
import getListOrderBuyer, {
  GetListOrderBuyerParams,
} from './controllers/get-list-order-buyer.admin.controller'
import getListOrderStore, {
  GetListOrderStoreParams,
} from './controllers/get-list-order-store.admin.controller'
import getListOrderStoreCms, {
  GetListOrderStoreCmsParams,
} from './controllers/get-list-order-store.cms.admin.controller'
import getOrderAdminController from './controllers/get-order.admin.controller'
import getOrderCmsAdminController from './controllers/get-order.cms.admin.controller'
import getOrderHistoryCustomer, {
  defaultOrderDetailFields,
  GetOrderhistoryCustomerParams,
} from './controllers/get-order-history-customer.cms.admin.controller'
import getListTransactionBuyer, {
  GetListTransactionBuyerParams,
} from './controllers/get-order-transaction-buyer.admin.controller'
import getListTransactionStore, {
  GetListTransactionStoreParams,
} from './controllers/get-order-transaction-store.admin.controller'
import getPaymentHistoryOrder, {
  defaultPaymentHistoryFields,
  GetPaymentHistoryOrderParams,
} from './controllers/get-payment-histories-order.cms.admin.controller'
import getTotalAmountOrder from './controllers/get-total-amount-order.cms.admin.controller'
import getTotalOrderStoreAdminController, {
  GetTotalOrderStoreParams,
} from './controllers/get-total-order-store.admin.controller'
import openCancelRequestController from './controllers/open-cancel-request.admin.controller'
import listOrderHistoryController, {
  GetListOrderHistoryParams,
} from './controllers/order-history/get-list-order-history.cms.admin.controller'
import getOrderHistoryDetailCmsAdminController from './controllers/order-history/get-order-history-detail.cms.admin.controller'
import validateBeforeReturnController from './controllers/order-return-request.admin.controller'
import updateOrderCms from './controllers/update-order.cms.admin.controller'
import { orderRelationships } from './services/order.service'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/list-order-store',
      method: 'get',
      handlers: [
        transformQuery(GetListOrderStoreParams, {
          defaultRelations: orderRelationships,
          // @ts-ignore
          defaultFields: defaultAdminOrdersFields.concat(['cancel_status']),
          allowedFields: allowedAdminOrdersFields,
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getListOrderStore),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/total-order-store',
      method: 'get',
      handlers: [
        transformQuery(GetTotalOrderStoreParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getTotalOrderStoreAdminController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/billing-store',
      method: 'get',
      handlers: [
        transformQuery(GetBillingByStoreParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(GetBillingStore),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/list-order-buyer',
      method: 'get',
      handlers: [
        transformQuery(GetListOrderBuyerParams, {
          // @ts-ignore
          defaultFields: defaultAdminOrdersFields.concat(['cancel_status']),
          allowedFields: allowedAdminOrdersFields,
          defaultRelations: [
            'items',
            'items.line_item_addons',
            'items.line_item_addons.lv1',
            'items.line_item_addons.lv2',
          ],
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getListOrderBuyer),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/order/:id/cancel',
      method: 'post',
      handlers: [wrapHandler(openCancelRequestController)],
    },
    {
      requiredAuth: true,
      path: '/admin/orders/:id',
      method: 'get',
      handlers: [wrapHandler(getOrderAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/orders/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getOrderCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/order/:id/cancel',
      method: 'delete',
      handlers: [wrapHandler(closeCancelRequestController)],
    },
    {
      requiredAuth: true,
      path: '/admin/list-transaction-buyer',
      method: 'get',
      handlers: [
        transformQuery(GetListTransactionBuyerParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getListTransactionBuyer),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/list-transaction-store',
      method: 'get',
      handlers: [
        transformQuery(GetListTransactionStoreParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getListTransactionStore),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/order/:id/fulfillment-status',
      method: 'put',
      handlers: [wrapHandler(chageOrderFulfillmentStatus)],
    },
    {
      requiredAuth: true,
      path: '/admin/order/:id/cms',
      method: 'patch',
      handlers: [wrapHandler(updateOrderCms)],
    },
    {
      requiredAuth: true,
      path: '/admin/list-order-cms',
      method: 'post',
      handlers: [wrapHandler(getListOrderCms)],
    },
    {
      requiredAuth: true,
      path: '/admin/list-order-store/:id',
      method: 'get',
      handlers: [
        transformQuery(GetListOrderStoreCmsParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getListOrderStoreCms),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/order-history-customer/:id',
      method: 'get',
      handlers: [
        transformQuery(GetOrderhistoryCustomerParams, {
          defaultFields: defaultOrderDetailFields,
          defaultRelations: ['payments'],
          defaultLimit: 10,
          isList: true,
        }),
        wrapHandler(getOrderHistoryCustomer),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/order-total-amount/:id',
      method: 'get',
      handlers: [wrapHandler(getTotalAmountOrder)],
    },
    {
      requiredAuth: true,
      path: '/admin/payment/:id/history',
      method: 'get',
      handlers: [
        transformQuery(GetPaymentHistoryOrderParams, {
          defaultFields: defaultPaymentHistoryFields,
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getPaymentHistoryOrder),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/order/:id/histories',
      method: 'get',
      handlers: [
        transformQuery(GetListOrderHistoryParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(listOrderHistoryController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/orders/:id/return',
      method: 'post',
      handlers: [
        validateBeforeReturnController,
        wrapHandler(requestReturnAdminController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/list-order-billing',
      method: 'get',
      handlers: [
        transformQuery(GetListOrderBillingParams, {
          defaultRelations: orderRelationships,
          // @ts-ignore
          defaultFields: defaultAdminOrdersFields.concat(['cancel_status']),
          allowedFields: allowedAdminOrdersFields,
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getListOrderBilling),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/order/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getOrderHistoryDetailCmsAdminController)],
    },
  ],
})
export class OrderRouter {}
