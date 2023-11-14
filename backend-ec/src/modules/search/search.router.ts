import { transformQuery } from '@medusajs/medusa/dist/api/middlewares'
import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import addNewQuerySearchStoreController from './controllers/add-new-query-search.store.controller'
import getProductSearchKeyController from './controllers/get-product-search-key.admin.controller'
import getSearchHealthController from './controllers/get-search-health.admin.controller'
import getSearchHistoryStoreController, {
  GetSearchHistoryReq,
} from './controllers/get-search-history.store.controller'
import resetSearchDataAdminController from './controllers/reset-search-data.admin.controller'
import resetSearchStoresAdminController from './controllers/reset-search-stores.admin.controller'
import syncSearchHistoryAdminController from './controllers/sync-search-history.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: false,
      path: '/admin/search/product-key',
      method: 'get',
      handlers: [wrapHandler(getProductSearchKeyController)],
    },
    {
      requiredAuth: false,
      path: '/admin/search/health',
      method: 'get',
      handlers: [wrapHandler(getSearchHealthController)],
    },
    {
      requiredAuth: true,
      path: '/admin/search/reset',
      method: 'post',
      handlers: [wrapHandler(resetSearchDataAdminController)],
    },
    {
      requiredAuth: false,
      path: '/store/search-history',
      method: 'post',
      handlers: [wrapHandler(addNewQuerySearchStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/search-history/sync',
      method: 'post',
      handlers: [wrapHandler(syncSearchHistoryAdminController)],
    },
    {
      requiredAuth: false,
      path: '/store/search-history',
      method: 'get',
      handlers: [
        transformQuery(GetSearchHistoryReq, {
          isList: true,
          defaultLimit: 15,
        }),
        wrapHandler(getSearchHistoryStoreController),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/search/reset/stores',
      method: 'post',
      handlers: [wrapHandler(resetSearchStoresAdminController)],
    },
  ],
})
export class SearchRouter {}
