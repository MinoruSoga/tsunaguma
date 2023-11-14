import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import inquiryController from './inquiry.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: false,
      path: '/admin/contact/inquiry',
      method: 'post',
      handlers: [wrapHandler(inquiryController)],
    },
  ],
})
export class InquiryRouter {}
