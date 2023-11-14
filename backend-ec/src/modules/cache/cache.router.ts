import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import resetMasterDataAdminController from './controllers/reset-master-data.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/cache/reset',
      method: 'post',
      handlers: [wrapHandler(resetMasterDataAdminController)],
    },
  ],
})
export class CacheRouter {}
