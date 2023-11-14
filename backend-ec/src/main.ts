import express from 'express'
import { Medusa } from 'medusa-extender'
import { resolve } from 'path'

import loadConfig from './helpers/config'
import loadCustomLoaders from './loaders/custom-loaders'
import loadCustomMiddlewares from './middlewares/custom-middlewares'
import { AttachmentModule } from './modules/attachment/attachment.module'
import { CacheModule } from './modules/cache/cache.module'
import { CampaignModule } from './modules/campaign-request/campaign_request.module'
import { CartModule } from './modules/cart/cart.module'
import { ChattingModule } from './modules/chatting/chatting.module'
import { ComplainModule } from './modules/complain/complain.module'
import { DeliveryRequestModule } from './modules/delivery-request/delivery-request.module'
import { DiscountModule } from './modules/discount/discount.module'
import { FavoriteModule } from './modules/favorite/favorite.module'
import { InquiryModule } from './modules/inquiries-contact/inquiry.module'
import { NotificationModule } from './modules/notification/notification.module'
import { OrderModule } from './modules/order/order.module'
import { PermissionModule } from './modules/permission/permission.module'
import { PointModule } from './modules/point/point.module'
import { PrefectureModule } from './modules/prefecture/prefecture.module'
import { ProductModule } from './modules/product/product.module'
import { ReturnModule } from './modules/return/return.module'
import { ReturnDeliveryModule } from './modules/return-delivery/return-delivery.module'
import { RoleModule } from './modules/role/role.module'
import { SearchModule } from './modules/search/search.module'
import { SeqModule } from './modules/seq/seq.module'
import { ShippingModule } from './modules/shipping/shipping.module'
import { StoreModule } from './modules/store/store.module'
import { UploadModule } from './modules/upload/upload.module'
import { UserModule } from './modules/user/user.module'
import { ViewedProductModule } from './modules/viewed-product/viewed-product.module'

async function bootstrap() {
  const expressInstance = express()

  // expressInstance.use((req, res, next) => {
  //   // allow use secure cookies
  //   req.headers['x-forwarded-proto'] = 'https'
  //   next()
  // })

  // overide medusa loaders
  await loadCustomLoaders()

  // overide medusa middlewares and add custom middlewares
  await loadCustomMiddlewares(expressInstance)

  await new Medusa(resolve(__dirname, '..'), expressInstance).load([
    SeqModule,
    CacheModule,
    PermissionModule,
    RoleModule,
    UserModule,
    StoreModule,
    ProductModule,
    OrderModule,
    PrefectureModule,
    CartModule,
    InquiryModule,
    ShippingModule,
    ChattingModule,
    PointModule,
    UploadModule,
    ComplainModule,
    NotificationModule,
    SearchModule,
    FavoriteModule,
    ViewedProductModule,
    DiscountModule,
    AttachmentModule,
    DeliveryRequestModule,
    ReturnModule,
    ReturnDeliveryModule,
    CampaignModule,
  ])

  const port = loadConfig()?.serverConfig?.port ?? 9000
  expressInstance.listen(port, () => {
    // eslint-disable-next-line no-console
    console.info('Server successfully started on port ' + port)
  })
}

bootstrap()
