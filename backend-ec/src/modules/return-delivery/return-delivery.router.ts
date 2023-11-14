import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import { Router } from 'medusa-extender'

import createReturnDeliveryAdminController from './controllers/create-return-delivery.admin.controller'
import createReturnDeliveryCmsAdminController from './controllers/create-return-delivery.cms.admin.controller'
import deleteReturnDeliveryController from './controllers/delete-return-delivery.admin.controller'
import listProductsReturnDeliveryController from './controllers/get-products-return-delivery.admin.controller'
import getReturnDeliveryHistoryDetailCmsAdminController from './controllers/history/get-return-delivery-history-detail.cms.admin.controller'
import listReturnDeliveryHistoryController, {
  GetReturnDeliveryHistoryParams,
} from './controllers/history/list-return-delivery-history.cms.admin.controller'
import getListReturnDelivery, {
  GetReturnDeliveriesParams,
} from './controllers/list-return-delivery.admin.controller'
import pauseReturnDeliveryController from './controllers/pause-return-delivery.cms.admin.controller'
import getReturnDeliveryDetail from './controllers/return-delivery-detail.cms.admin.controller'
import searchReturnDeliveryCmsController from './controllers/search-return-delivery.cms.admin.controller'
import updateReturnDeliveryCmsController from './controllers/update-return-delivery.cms.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/return-delivery',
      method: 'post',
      handlers: [wrapHandler(createReturnDeliveryAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return-deliveries',
      method: 'get',
      handlers: [
        transformQuery(GetReturnDeliveriesParams, {
          defaultLimit: 10,
          defaultRelations: ['variant', 'variant.options'],
          isList: true,
        }),
        wrapHandler(getListReturnDelivery),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/search',
      method: 'post',
      handlers: [wrapHandler(searchReturnDeliveryCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/:id/pause',
      method: 'patch',
      handlers: [wrapHandler(pauseReturnDeliveryController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/:id',
      method: 'delete',
      handlers: [wrapHandler(deleteReturnDeliveryController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/:id',
      method: 'get',
      handlers: [wrapHandler(getReturnDeliveryDetail)],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/cms',
      method: 'post',
      handlers: [wrapHandler(createReturnDeliveryCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/:id',
      method: 'put',
      handlers: [wrapHandler(updateReturnDeliveryCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/:id/histories',
      method: 'get',
      handlers: [
        transformQuery(GetReturnDeliveryHistoryParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(listReturnDeliveryHistoryController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getReturnDeliveryHistoryDetailCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return-delivery/:id/products',
      method: 'get',
      handlers: [wrapHandler(listProductsReturnDeliveryController)],
    },
  ],
})
export class ReturnDeliveryRouter {}
