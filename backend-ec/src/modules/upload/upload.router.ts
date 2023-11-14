import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { Router } from 'medusa-extender'

import getUploadCsvLinkAdminController from './controllers/get-upload-csv-link.admin.controller'
import genInquiryAttachmentUrlController from './controllers/get-upload-inquiry-attachment.admin.controller'
import genChattingFileUrlController from './controllers/upload-chatting-file.admin.controller'
import genUploadCsvLinkAdminController from './controllers/upload-csv-file.admin.controller'
import genProductImageUrlController from './controllers/upload-product-image-url.admin.controller'
import genStoreAvatarUrlController from './controllers/upload-store-avatar.admin.controller'
import genStoreImageUrlController from './controllers/upload-store-image.admin.controller'
import genAvatarUrlController from './controllers/upload-user-avatar.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: true,
      path: '/admin/upload/product-image',
      method: 'post',
      handlers: [wrapHandler(genProductImageUrlController)],
    },
    {
      requiredAuth: true,
      path: '/admin/upload/avatar',
      method: 'post',
      handlers: [wrapHandler(genAvatarUrlController)],
    },
    {
      requiredAuth: true,
      path: '/admin/upload/store/avatar',
      method: 'post',
      handlers: [wrapHandler(genStoreAvatarUrlController)],
    },
    {
      requiredAuth: true,
      path: '/admin/upload/store/image',
      method: 'post',
      handlers: [wrapHandler(genStoreImageUrlController)],
    },
    {
      requiredAuth: false,
      path: '/admin/upload/inquiry',
      method: 'post',
      handlers: [wrapHandler(genInquiryAttachmentUrlController)],
    },
    {
      requiredAuth: false,
      path: '/admin/upload/inquiry',
      method: 'post',
      handlers: [wrapHandler(genInquiryAttachmentUrlController)],
    },
    {
      requiredAuth: true,
      path: '/admin/upload/chatting',
      method: 'post',
      handlers: [wrapHandler(genChattingFileUrlController)],
    },
    {
      requiredAuth: true,
      path: '/admin/upload/csv',
      method: 'post',
      handlers: [wrapHandler(genUploadCsvLinkAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/upload/export/csv',
      method: 'get',
      handlers: [wrapHandler(getUploadCsvLinkAdminController)],
    },
  ],
})
export class UploadRouter {}
