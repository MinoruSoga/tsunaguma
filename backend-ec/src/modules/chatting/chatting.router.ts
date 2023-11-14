import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import chattingMessageCreateAdminController from './controllers/chatting-message-create.admin.controller'
import chattingMessageListAdminController from './controllers/chatting-message-list.admin.controller'
import chattingPusherAuthAdminController from './controllers/chatting-pusher-auth.admin.controller'
import chattingPusherAuthCmsAdminController from './controllers/chatting-pusher-auth.cms.admin.controller'
import chattingThreadController from './controllers/chatting-thread.admin.controller'
import chattingThreadCmsAdminController from './controllers/chatting-thread.cms.admin.controller'
import chattingThreadDetailAdminController from './controllers/chatting-thread-detail.admin.controller'
import chattingThreadDetailCmsAdminController from './controllers/chatting-thread-detail.cms.admin.controller'
import chattingThreadPinAdminController from './controllers/chatting-thread-pin.admin.controller'
import chattingThreadReadAdminController from './controllers/chatting-thread-read.admin.controller'
import deleteChattingThreadCmsAdminController from './controllers/delete-chatting-thread.cms.admin.controller'
import totalUnreadChattingThreadAdminController from './controllers/total-unread-chatting-thread.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/chatting/threads',
      method: 'get',
      handlers: [wrapHandler(chattingThreadController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/threads-cms',
      method: 'post',
      handlers: [wrapHandler(chattingThreadCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/messages/:id',
      method: 'get',
      handlers: [wrapHandler(chattingMessageListAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/messages/:id',
      method: 'post',
      handlers: [wrapHandler(chattingMessageCreateAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/threads/:id/pin',
      method: 'post',
      handlers: [wrapHandler(chattingThreadPinAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/threads/:id/read',
      method: 'post',
      handlers: [wrapHandler(chattingThreadReadAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/threads/:id',
      method: 'get',
      handlers: [wrapHandler(chattingThreadDetailAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/pusher/auth',
      method: 'post',
      handlers: [wrapHandler(chattingPusherAuthAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/threads/:id/cms',
      method: 'get',
      handlers: [wrapHandler(chattingThreadDetailCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/pusher/auth/cms',
      method: 'post',
      handlers: [wrapHandler(chattingPusherAuthCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/threads/total/unread',
      method: 'get',
      handlers: [wrapHandler(totalUnreadChattingThreadAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/chatting/thread/:id/cms',
      method: 'delete',
      handlers: [wrapHandler(deleteChattingThreadCmsAdminController)],
    },
  ],
})
export class ChattingRouter {}
