import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import createShippingAddress from '@medusajs/medusa/dist/api/routes/store/customers/create-address'
import { Router } from 'medusa-extender'

import { prepareCreateAddressController } from './controllers/address/create-address.store.controller'
import syncAddressAdminController from './controllers/address/sync-address.admin.controller'
import checkResetPasswordTokenController from './controllers/forgot-password-check.admin.controller'
import requestForgotPasswordController from './controllers/forgot-password-request.admin.controller'
import resetPasswordController from './controllers/forgot-password-reset.admin.controller'
import getCustomerUpdateHistoryCmsAdminController from './controllers/get-customer-update-history-cms.admin.controller'
import { GetListUserCmsParams } from './controllers/get-list-email-store.cms.admin.controller'
import listEmailCmsController from './controllers/get-list-email-store.cms.admin.controller'
import listUserHistoryController, {
  GetListUserHistoryParams,
} from './controllers/get-list-user-history.cms.admin.controller'
import getUserController, {
  GetUserByIdParams,
} from './controllers/get-user-by-id.admin.controller'
import getUserInfoAdminControllerAdmin from './controllers/get-user-info.admin.controller'
import listUserController from './controllers/get-user-list.cms.admin.controller'
import createGmoMemberAdminController from './controllers/gmo/create-gmo-member.admin.controller'
import getCardGmoAdminController from './controllers/gmo/get-card-gmo.admin.controller'
import getGmoCardsAdminController from './controllers/gmo/get-gmo-cards.admin.controller'
import loginController from './controllers/login.admin.controller'
import loginCMSController from './controllers/login.cms.admin.controller'
import registerAdminController from './controllers/register.admin.controller'
import registerCheckAdminController from './controllers/register-check.admin.controller'
import registerTokenAdminController from './controllers/register-token.admin.controller'
import registerUserCmsAdminController from './controllers/register-user.cms.admin.controller'
import updateCustomerStoreController from './controllers/update-customer.store.controller'
import updateUserCmsAdminController from './controllers/update-user.cms.admin.controller'
import checkWithdrawalAdminController from './controllers/withdrawal/check-withdrawal.admin.controller'
import createWithdrawalAdminController from './controllers/withdrawal/create-withdrawal.admin.controller'
import getWithdrawalReasonAdminController from './controllers/withdrawal/get-withdrawal-reason.admin.controller'
import restoreUserAdminController from './controllers/withdrawal/restore-user.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: false,
      path: '/admin/auth',
      method: 'post',
      handlers: [wrapHandler(loginController)],
    },
    {
      requiredAuth: false,
      path: '/admin/auth/cms',
      method: 'post',
      handlers: [wrapHandler(loginCMSController)],
    },
    {
      requiredAuth: false,
      path: '/admin/users/register',
      method: 'post',
      handlers: [wrapHandler(registerTokenAdminController)],
    },
    {
      requiredAuth: false,
      path: '/admin/users/register/:token',
      method: 'get',
      handlers: [wrapHandler(registerCheckAdminController)],
    },
    {
      requiredAuth: false,
      path: '/admin/users/register/:token',
      method: 'post',
      handlers: [registerAdminController, wrapHandler(loginController)],
    },
    {
      requiredAuth: false,
      path: '/admin/users/forgot-password',
      method: 'post',
      handlers: [wrapHandler(requestForgotPasswordController)],
    },
    {
      requiredAuth: false,
      path: '/admin/users/forgot-password/:token',
      method: 'get',
      handlers: [wrapHandler(checkResetPasswordTokenController)],
    },
    {
      requiredAuth: false,
      path: '/admin/users/forgot-password/:token',
      method: 'put',
      handlers: [wrapHandler(resetPasswordController)],
    },
    {
      requiredAuth: true,
      path: '/store/customers/me/addresses',
      method: 'post',
      handlers: [
        prepareCreateAddressController,
        wrapHandler(createShippingAddress),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/customers/sync-address',
      method: 'post',
      handlers: [wrapHandler(syncAddressAdminController)],
    },
    {
      requiredAuth: true,
      path: '/store/customers/me',
      method: 'post',
      handlers: [wrapHandler(updateCustomerStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/users/gmo-member',
      method: 'post',
      handlers: [wrapHandler(createGmoMemberAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/users/card',
      method: 'get',
      handlers: [wrapHandler(getCardGmoAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/users/gmo-cards',
      method: 'get',
      handlers: [wrapHandler(getGmoCardsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/users/detail',
      method: 'get',
      handlers: [wrapHandler(getUserInfoAdminControllerAdmin)],
    },
    {
      requiredAuth: true,
      path: '/admin/users/search',
      method: 'post',
      handlers: [wrapHandler(listUserController)],
    },
    {
      requiredAuth: true,
      path: '/admin/user/:id',
      method: 'get',
      handlers: [
        transformQuery(GetUserByIdParams, {
          isList: true,
          defaultLimit: 10,
          defaultRelations: ['address'],
        }),
        wrapHandler(getUserController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/user/:id/cms',
      method: 'patch',
      handlers: [wrapHandler(updateUserCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/user/register-cms',
      method: 'post',
      handlers: [wrapHandler(registerUserCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/user/:id/histories',
      method: 'get',
      handlers: [
        transformQuery(GetListUserHistoryParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(listUserHistoryController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/users/cms',
      method: 'get',
      handlers: [
        transformQuery(GetListUserCmsParams, {
          isList: true,
        }),
        wrapHandler(listEmailCmsController),
      ],
    },

    // withdrawal
    {
      requiredAuth: false,
      path: '/admin/users/withdrawal/reason',
      method: 'get',
      handlers: [wrapHandler(getWithdrawalReasonAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/users/withdrawal',
      method: 'post',
      handlers: [wrapHandler(createWithdrawalAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/users/withdrawal/check',
      method: 'post',
      handlers: [wrapHandler(checkWithdrawalAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/users/withdrawal/restore',
      method: 'post',
      handlers: [wrapHandler(restoreUserAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/user/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getCustomerUpdateHistoryCmsAdminController)],
    },
  ],
})
export class UserRouter {}
