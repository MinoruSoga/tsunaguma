import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import { Router } from 'medusa-extender'

import getViewedProduct from './controllers/get-viewed-product.store.controller'
import { GetListViewedProductParams } from './controllers/get-viewed-product.store.controller'
import syncViewedProductController from './controllers/sync-viewed-product.store.controller'
import updateViewedProduct from './controllers/update-viewed-product.store.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/store/viewed-products',
      method: 'get',
      handlers: [
        transformQuery(GetListViewedProductParams, {
          defaultLimit: 10,
          defaultRelations: ['product'],
          isList: true,
        }),
        wrapHandler(getViewedProduct),
      ],
    },
    {
      requiredAuth: true,
      path: '/store/viewed-products',
      method: 'put',
      handlers: [wrapHandler(updateViewedProduct)],
    },
    {
      requiredAuth: true,
      path: '/store/viewed-products/sync',
      method: 'put',
      handlers: [wrapHandler(syncViewedProductController)],
    },
  ],
})
export class ViewedProductRouter {}
