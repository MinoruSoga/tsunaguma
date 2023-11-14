import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import { Router } from 'medusa-extender'

import addStockDeliveryRequestAdminController from './controllers/add-stock-delivery-request.admin.controller'
import cancelDeliveryRequestAdminController from './controllers/cancel-delivery-request.admin.controller'
import createdDeliveryRequestAdminController from './controllers/created-delivery-request.admin.controller'
import deleteDelieryRequestCmsAdminController from './controllers/delete-delivery-request.cms.admin.controller'
import getDeliveryRequestDetailCmsAdminController from './controllers/get-delivery-request-detail.cms.admin.controller'
import getDeliveryRequestHistoryCmsAdminController from './controllers/get-delivery-request-history-cms.admin.controller'
import getListDeliveryRequestAdminController from './controllers/get-list-delivery-request.admin.controller'
import getMyDeliveryProductsAdminController from './controllers/get-my-delivery-products.admin.controller'
import getMyDeliveryRequestAdminController from './controllers/get-my-delivery-request.admin.controller'
import listDeliveryRequestHistoryController, {
  GetDeliveryRequestHistoryParams,
} from './controllers/history/get-delivery-request-history.cms.admin.controller'
import searchDeliveryRequestCmsAdminController from './controllers/search/search-delivery-request.cms.admin.controller'
import stopDeliveryRequestCmsAdminController from './controllers/stop-delivery-request.cms.admin.controller'
import updateDeliveryRequestAdminController from './controllers/update-delivery-request.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/delivery-request',
      method: 'post',
      handlers: [wrapHandler(createdDeliveryRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/:id',
      method: 'get',
      handlers: [wrapHandler(getMyDeliveryRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-requests',
      method: 'get',
      handlers: [wrapHandler(getListDeliveryRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/add-stock',
      method: 'post',
      handlers: [wrapHandler(addStockDeliveryRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/cancel/:id',
      method: 'post',
      handlers: [wrapHandler(cancelDeliveryRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/:id',
      method: 'put',
      handlers: [wrapHandler(updateDeliveryRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-requests/products',
      method: 'get',
      handlers: [wrapHandler(getMyDeliveryProductsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-requests/search',
      method: 'post',
      handlers: [wrapHandler(searchDeliveryRequestCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/:id',
      method: 'delete',
      handlers: [wrapHandler(deleteDelieryRequestCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getDeliveryRequestDetailCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/:id/histories',
      method: 'get',
      handlers: [
        transformQuery(GetDeliveryRequestHistoryParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(listDeliveryRequestHistoryController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getDeliveryRequestHistoryCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/delivery-request/stop/:id',
      method: 'post',
      handlers: [wrapHandler(stopDeliveryRequestCmsAdminController)],
    },
  ],
})
export class DeliveryRequestRouter {}
