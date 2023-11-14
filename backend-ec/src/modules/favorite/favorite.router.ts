import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import { Router } from 'medusa-extender'

import AddProductFavoriteStoreController from './controllers/add-product-favorite.store.controller'
import checkFollowStoreAdminController from './controllers/check-follow-store.admin.controller'
import followStoreAdminController from './controllers/follow-store.admin.controller'
import getListFavoriteProductByStoreStoreController, {
  ProductFavoriteByStoreQueryParams,
} from './controllers/get-list-favorite-product-by-store.store.controller'
import getListFollowingStoreByStoreController, {
  FollowingStoreByStoreQueryParams,
} from './controllers/get-list-following-store-by-store.store.controller'
import getMyFollowers, {
  GetMyFollowersParams,
} from './controllers/get-my-followers.admin.controller'
import ProductFavoriteStoreController from './controllers/product-favorite.store.controller'
import StoreFavoriteStoreController, {
  StoreFavoriteQueryParams,
} from './controllers/store-favorite.admin.controller'
import SyncProductFavoriteStoreController from './controllers/sync-product-favorite.store.controller'

@Router({
  routes: [
    {
      requiredAuth: false,
      path: '/store/favorite/product',
      method: 'get',
      handlers: [wrapHandler(ProductFavoriteStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/follow/check-follow',
      method: 'post',
      handlers: [wrapHandler(checkFollowStoreAdminController)],
    },
    {
      requiredAuth: false,
      path: '/store/list-favorite-product-by-store/:id',
      method: 'get',
      handlers: [
        transformQuery(ProductFavoriteByStoreQueryParams, {
          isList: true,
          defaultRelations: ['product', 'product.variants'],
          defaultLimit: 10,
        }),
        wrapHandler(getListFavoriteProductByStoreStoreController),
      ],
    },
    {
      requiredAuth: false,
      path: '/store/list-following-store-by-store/:id',
      method: 'get',
      handlers: [
        transformQuery(FollowingStoreByStoreQueryParams, {
          isList: true,
          defaultRelations: ['store'],
          defaultLimit: 10,
        }),
        wrapHandler(getListFollowingStoreByStoreController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/favorite/store',
      method: 'get',
      handlers: [
        transformQuery(StoreFavoriteQueryParams, {
          isList: true,
          defaultRelations: ['store'],
          defaultLimit: 10,
        }),
        wrapHandler(StoreFavoriteStoreController),
      ],
    },
    {
      requiredAuth: true,
      path: '/store/favorite/sync-product',
      method: 'post',
      handlers: [wrapHandler(SyncProductFavoriteStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/store/:id/follow',
      method: 'put',
      handlers: [wrapHandler(followStoreAdminController)],
    },
    {
      requiredAuth: true,
      path: '/store/favorite/product',
      method: 'put',
      handlers: [wrapHandler(AddProductFavoriteStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/my-followers',
      method: 'get',
      handlers: [
        transformQuery(GetMyFollowersParams, {
          isList: true,
          defaultRelations: ['user'],
          defaultLimit: 10,
        }),
        wrapHandler(getMyFollowers),
      ],
    },
  ],
})
export class FavoriteRouter {}
