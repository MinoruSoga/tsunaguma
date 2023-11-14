import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import { Router } from 'medusa-extender'

import deleteReturnController from './controllers/delete-return.cms.admin.controller'
import getReturnDetailCmsController from './controllers/get-detail-return.cms.admin.controller'
import getDetailReturnHistoryCmsAdminController from './controllers/history/get-detail-return-history.cms.admin.controller'
import listReturnHistoryController, {
  GetReturnHistoryParams,
} from './controllers/history/list-return-histories.cms.admin.controller'
import listReturnController, {
  GetReturnsbyParams,
} from './controllers/list-returns.admin.controller'
import pauseReturnController from './controllers/pause-return.cms.admin.controller'
import listReturnCmsController from './controllers/search-return.cms.admin.controller'
import updateReturnCmsController from './controllers/update-return.cms.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/return/search',
      method: 'post',
      handlers: [wrapHandler(listReturnCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/list-returns',
      method: 'get',
      handlers: [
        transformQuery(GetReturnsbyParams, {
          isList: true,
          defaultLimit: 6,
        }),
        wrapHandler(listReturnController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/return/:id',
      method: 'get',
      handlers: [wrapHandler(getReturnDetailCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return/:id/pause',
      method: 'post',
      handlers: [wrapHandler(pauseReturnController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return/:id/cms',
      method: 'put',
      handlers: [wrapHandler(updateReturnCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return/:id/histories',
      method: 'get',
      handlers: [
        transformQuery(GetReturnHistoryParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(listReturnHistoryController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/return/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getDetailReturnHistoryCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/return/:id/delete',
      method: 'post',
      handlers: [wrapHandler(deleteReturnController)],
    },
  ],
})
export class ReturnRouter {}
