import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import createCampaignRequestAdminController from './controllers/create-campaign-request.admin.controller'
import deleteCampaignRequestAdminController from './controllers/delete-campaign-request.admin.controller'
import retrieveMyCampaignRequestAdminController from './controllers/retrieve-my-campaign-request.admin.controller'
import updateCampaignRequestAdminController from './controllers/update-campaign-request.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/campaign-request',
      method: 'post',
      handlers: [wrapHandler(createCampaignRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/campaign-request',
      method: 'get',
      handlers: [wrapHandler(retrieveMyCampaignRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/campaign-request/:id',
      method: 'put',
      handlers: [wrapHandler(updateCampaignRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/campaign-request/:id',
      method: 'delete',
      handlers: [wrapHandler(deleteCampaignRequestAdminController)],
    },
  ],
})
export class CampaignRouter {}
