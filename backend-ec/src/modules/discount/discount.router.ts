import { transformQuery } from '@medusajs/medusa/dist/api/middlewares'
import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import createDiscountCodeAdminController from './controllers/create-discount-code.admin.controller'
import deleteDiscountCmsAdminController from './controllers/delete-discount.cms.admin.controller'
import getDiscountHistoryDetailCmsAdminController from './controllers/discount-history/get-discount-history-detail.cms.admin.controller'
import listDiscountHistoryController, {
  GetListDiscountHistoryParams,
} from './controllers/discount-history/list-discount-history.cms.admin.controller'
import getDiscountDetailCmsController from './controllers/get-discount-detail-cms.admin.controller'
import getCustomerGroupDetailCmsController, {
  GetCustomerGroupDetailParams,
} from './controllers/get-list-customer-group-cms.admin.controller'
import getListStoreDiscount, {
  GetListStoreDiscountParams,
} from './controllers/get-list-store-discount.admin.controller'
import getStoreGroupDetailCmsController, {
  GetStoreGroupDetailParams,
} from './controllers/get-list-store-group-detail-cms.admin.controller'
import getTotalStoreDiscount, {
  GetTotalStoreDiscountParams,
} from './controllers/get-total-discount.cms.admin.controller'
import listDiscountAvailable, {
  ListDiscountAvailableParams,
} from './controllers/list-discount-available.store.controller'
import searchDiscountsController from './controllers/search-discount/search-discount.cms.admin.controller'
import addStoresBatchAdminController from './controllers/store-group/add-stores-batch.admin.controller'
import getDisableDiscountCmsController from './controllers/store-using-discount.admin.controller'
import updateDiscountCodeAdminController from './controllers/update-discount-code.admin.controller'
import createUserCouponAdminController from './controllers/user-coupon/create-user-coupon.admin.controller'
import getListUserCoupon, {
  GetListUserCouponParams,
} from './controllers/user-coupon/list-user-coupon.admin.controller'

export const defaultAdminDiscountsRelations = [
  'rule',
  'parent_discount',
  'rule.conditions',
  'rule.conditions.product_types',
]

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/mystore/discounts',
      method: 'get',

      handlers: [
        transformQuery(GetListStoreDiscountParams, {
          isList: true,
          defaultRelations: ['rule'],
        }),
        wrapHandler(getListStoreDiscount),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/store/discounts/:id/cms',
      method: 'get',

      handlers: [
        transformQuery(GetTotalStoreDiscountParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getTotalStoreDiscount),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/store-groups/:id/batch',
      method: 'post',
      handlers: [wrapHandler(addStoresBatchAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/discounts',
      method: 'post',
      handlers: [wrapHandler(createDiscountCodeAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/discounts/:id',
      method: 'put',
      handlers: [wrapHandler(updateDiscountCodeAdminController)],
    },
    {
      requiredAuth: false,
      path: '/store/discounts/available',
      method: 'get',
      handlers: [
        transformQuery(ListDiscountAvailableParams, {
          isList: true,
          defaultLimit: 10,
          defaultRelations: defaultAdminDiscountsRelations,
        }),
        wrapHandler(listDiscountAvailable),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/user-coupon',
      method: 'post',
      handlers: [wrapHandler(createUserCouponAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/user-coupons',
      method: 'get',
      handlers: [
        transformQuery(GetListUserCouponParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getListUserCoupon),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/store-group-cms/:id',
      method: 'get',
      handlers: [
        transformQuery(GetStoreGroupDetailParams, {
          isList: true,
          defaultLimit: 100,
        }),
        wrapHandler(getStoreGroupDetailCmsController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/customer-group-cms/:id',
      method: 'get',
      handlers: [
        transformQuery(GetCustomerGroupDetailParams, {
          isList: true,
          defaultLimit: 100,
        }),
        wrapHandler(getCustomerGroupDetailCmsController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/discount/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getDiscountDetailCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/discount/:id/stop',
      method: 'delete',
      handlers: [wrapHandler(getDisableDiscountCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/discount/:id/histories',
      method: 'get',
      handlers: [
        transformQuery(GetListDiscountHistoryParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(listDiscountHistoryController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/discounts/search',
      method: 'post',
      handlers: [wrapHandler(searchDiscountsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/discount/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getDiscountHistoryDetailCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/discount/:id/cms',
      method: 'delete',
      handlers: [wrapHandler(deleteDiscountCmsAdminController)],
    },
  ],
})
export class DiscountRouter {}
