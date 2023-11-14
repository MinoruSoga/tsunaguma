import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import SendComplainAdminController from './controllers/send-complain.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/complain/product',
      method: 'post',
      handlers: [wrapHandler(SendComplainAdminController)],
    },
  ],
})
export class ComplainRouter {}
