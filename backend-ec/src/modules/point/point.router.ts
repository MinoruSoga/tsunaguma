import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import initPointAdminController from './controllers/init-point.admin.controller'
import updatePointCmsAdminController from './controllers/update-point.cms.admin.controller'
import UserPointExpiredAdminController from './controllers/user-point-expired.admin.controller'
import UserPointHistoryAdminController from './controllers/user-point-history.admin.controller'
import userPointHistoryCmsAdminController from './controllers/user-point-history.cms.admin.controller'
import UserPointTotalAdminController from './controllers/user-point-total.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/point/history',
      method: 'get',
      handlers: [wrapHandler(UserPointHistoryAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/point/total',
      method: 'get',
      handlers: [wrapHandler(UserPointTotalAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/point/about-expired',
      method: 'get',
      handlers: [wrapHandler(UserPointExpiredAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/point/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(userPointHistoryCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/point/history/init',
      method: 'post',
      handlers: [wrapHandler(initPointAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/point/history/cms',
      method: 'post',
      handlers: [wrapHandler(updatePointCmsAdminController)],
    },
  ],
})
export class PointRouter {}
