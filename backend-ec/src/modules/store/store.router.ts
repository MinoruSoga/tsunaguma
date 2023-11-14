import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import { Router } from 'medusa-extender'

import getStoreGroupDetailCmsController from '../discount/controllers/get-list-store-group-detail-cms.admin.controller'
import approveStoreRegController from './controllers/approved-store-reg.admin.controller'
import deleteStoreAdminController from './controllers/delete-store.admin.controller'
import getFreeShippingStoreController from './controllers/get-free-ship-setting.admin.controller'
import listStoreHistoryController, {
  GetListStoreHistoryParams,
} from './controllers/get-list-store-history.cms.admin.controller'
import getStoreById, {
  GetStoreByIdParams,
} from './controllers/get-store-by-id.admin.controller'
import getStoreHistoryCmsAdminController from './controllers/get-store-history-cms.admin.controller'
import getStoreListAdminController, {
  defaultStoreFields,
  defaultStoreRelations,
  GetListStoreParams,
} from './controllers/get-store-list.admin.controller'
import listStoreCmsController from './controllers/get-store-list.cms.admin.controller'
import createPaybackSettingAdminController from './controllers/payback-setting/create-payback-setting.admin.controller'
import getPaybackSettingAdminController from './controllers/payback-setting/get-payback-setting.admin.controller'
import updatePaybackSettingAdminController from './controllers/payback-setting/update-payback-setting.admin.controller'
import createProductAddonController from './controllers/product-addons/create-product-addon.admin.controller'
import deleteProductAddonController from './controllers/product-addons/delete-product-addon.admin.controller'
import getProductAddonDetailController from './controllers/product-addons/detail-product-addon.admin.controller'
import editProductAddonController from './controllers/product-addons/edit-product-addon.admin.controller'
import getAllProductAddonsController from './controllers/product-addons/list-product-addon.admin.controller'
import getProductAddonsStore from './controllers/product-addons/list-product-addon.cms.admin.controller'
import createdStoreBillingController from './controllers/profile/create-store-billing.admin.controller'
import getStoreBillingController from './controllers/profile/get-store-billing.admin.controller'
import getStoreBillingHistoryController, {
  GetBillingHistoryParams,
} from './controllers/profile/get-store-billing-history.admin.controller'
import getStoreDetailCms from './controllers/profile/get-store-detail.cms.admin.controller'
import getStoreInformationController from './controllers/profile/show-store-information.admin.controller'
import getStoreBillingDetailController from './controllers/profile/store-billing-detail.admin.controller'
import updateCustomerInfoAdminController from './controllers/profile/update-customer-info.admin.controller'
import updateStoreCmsController from './controllers/profile/update-store.cms.admin.controller'
import updateStoreInformationController from './controllers/profile/update-store-information.admin.controller'
import updateStoreBillingTransferTypeController from './controllers/profile/update-transfer-type-billing.admin.controller'
import registerStoreController from './controllers/register-store.admin.controller'
import registerStoreCmsController from './controllers/register-store.cms.admin.controller'
import resetStoreNewTransactionAdminController from './controllers/reset-store-new-transaction.admin.controller'
import setShippingMethodDefaultController, {
  SetShippingOptionParams,
} from './controllers/set-shipping-method-prime.admin.controller'
import settingFreeShipStoreController from './controllers/setting-free-ship-store.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/mystore/register',
      method: 'post',
      handlers: [wrapHandler(registerStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/product-addon',
      method: 'post',
      handlers: [wrapHandler(createProductAddonController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/product-addon',
      method: 'get',
      handlers: [wrapHandler(getAllProductAddonsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/product-addon/:id',
      method: 'get',
      handlers: [wrapHandler(getProductAddonDetailController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/product-addon/:id',
      method: 'patch',
      handlers: [wrapHandler(editProductAddonController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/information',
      method: 'get',
      handlers: [wrapHandler(getStoreInformationController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/information',
      method: 'put',
      handlers: [wrapHandler(updateStoreInformationController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/reset-new-transaction',
      method: 'put',
      handlers: [wrapHandler(resetStoreNewTransactionAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/product-addon/:id',
      method: 'delete',
      handlers: [wrapHandler(deleteProductAddonController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/payback-setting',
      method: 'post',
      handlers: [wrapHandler(createPaybackSettingAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/payback-setting',
      method: 'patch',
      handlers: [wrapHandler(updatePaybackSettingAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/payback-setting',
      method: 'get',
      handlers: [wrapHandler(getPaybackSettingAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/free-ship-setting',
      method: 'put',
      handlers: [wrapHandler(settingFreeShipStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/free-ship-setting',
      method: 'get',
      handlers: [wrapHandler(getFreeShippingStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/stores/:id',
      method: 'delete',
      handlers: [wrapHandler(deleteStoreAdminController)],
    },
    {
      requiredAuth: false,
      path: '/admin/stores',
      method: 'get',
      handlers: [
        transformQuery(GetListStoreParams, {
          isList: true,
          defaultRelations: defaultStoreRelations,
          defaultFields: defaultStoreFields,
        }),
        wrapHandler(getStoreListAdminController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/billing-detail',
      method: 'get',
      handlers: [wrapHandler(getStoreBillingDetailController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/billing/transfer-type',
      method: 'put',
      handlers: [wrapHandler(updateStoreBillingTransferTypeController)],
    },
    {
      requiredAuth: true,
      path: '/admin/store',
      method: 'patch',
      handlers: [wrapHandler(updateCustomerInfoAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/store/:id/approve',
      method: 'put',
      handlers: [wrapHandler(approveStoreRegController)],
    },
    {
      requiredAuth: true,
      path: '/admin/store/:id/cms',
      method: 'patch',
      handlers: [wrapHandler(updateStoreCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/store/register/cms',
      method: 'post',
      handlers: [wrapHandler(registerStoreCmsController)],
    },
    {
      requiredAuth: false,
      path: '/admin/store/:id',
      method: 'get',
      handlers: [
        transformQuery(GetStoreByIdParams, {
          defaultRelations: [
            // 'payback_setting',
            'store_detail',
            'owner',
            // 'store_billing',
            // 'members',
            'store_detail.prefecture',
            'store_detail.prefecture.parent',
          ],
        }),
        wrapHandler(getStoreById),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/store/:id/cms',
      method: 'get',
      handlers: [
        transformQuery(GetStoreByIdParams, {
          defaultRelations: [
            'payback_setting',
            'store_detail',
            'owner',
            'store_detail.prefecture',
            'store_detail.prefecture.parent',
          ],
        }),
        wrapHandler(getStoreById),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/store/:id/histories',
      method: 'get',
      handlers: [
        transformQuery(GetListStoreHistoryParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(listStoreHistoryController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/product-addon/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getProductAddonsStore)],
    },
    {
      requiredAuth: true,
      path: '/admin/stores/cms',
      method: 'post',
      handlers: [wrapHandler(listStoreCmsController)],
    },
    {
      requiredAuth: true,
      path: '/admin/store/shipping/default',
      method: 'get',
      handlers: [
        transformQuery(SetShippingOptionParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(setShippingMethodDefaultController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/billing',
      method: 'get',
      handlers: [wrapHandler(getStoreBillingController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/billing',
      method: 'post',
      handlers: [wrapHandler(createdStoreBillingController)],
    },
    {
      requiredAuth: true,
      path: '/admin/mystore/billing-history',
      method: 'get',
      handlers: [
        transformQuery(GetBillingHistoryParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getStoreBillingHistoryController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/store-detail/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getStoreDetailCms)],
    },
    {
      requiredAuth: true,
      path: '/admin/store/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getStoreHistoryCmsAdminController)],
    },
  ],
})
export class StoreRouter {}
