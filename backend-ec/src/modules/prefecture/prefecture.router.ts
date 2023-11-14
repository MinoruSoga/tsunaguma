import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import getPostcodeByIdController from './controllers/postcode.admin.controller'
import getAllPrefecturesController from './controllers/prefecture.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: false,
      path: '/admin/prefecture',
      method: 'get',
      handlers: [wrapHandler(getAllPrefecturesController)],
    },
    {
      requiredAuth: false,
      path: '/admin/postcode/:id',
      method: 'get',
      handlers: [wrapHandler(getPostcodeByIdController)],
    },
  ],
})
export class PrefectureRouter {}
