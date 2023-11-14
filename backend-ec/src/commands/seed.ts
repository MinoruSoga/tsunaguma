import express from 'express'
import { Medusa } from 'medusa-extender'
import { resolve } from 'path'
import { EntityManager } from 'typeorm'

import { CartModule } from '../modules/cart/cart.module'
import { ComplainModule } from '../modules/complain/complain.module'
import { InquiryModule } from '../modules/inquiries-contact/inquiry.module'
import { OrderModule } from '../modules/order/order.module'
import { PermissionModule } from '../modules/permission/permission.module'
import { PointModule } from '../modules/point/point.module'
import { PrefectureModule } from '../modules/prefecture/prefecture.module'
import { ProductModule } from '../modules/product/product.module'
import { RoleModule } from '../modules/role/role.module'
import { ShippingModule } from '../modules/shipping/shipping.module'
import { StoreModule } from '../modules/store/store.module'
import { UploadModule } from '../modules/upload/upload.module'
import { UserModule } from '../modules/user/user.module'
import seedCustomers from './seeds/customer'
import seedFulfillmentProvivder from './seeds/fulfillment-provider'
import seedMaterials from './seeds/material'
import seedProductAddon from './seeds/product-addon'
import seedColors from './seeds/product-color'
import seedSpecs from './seeds/product-spec'
import seedProductType from './seeds/product-type'
import seedRegion from './seeds/region'
import seedShippingOption from './seeds/shipping-option'
import seedUsers from './seeds/user'

async function seed() {
  const container = await new Medusa(
    resolve(__dirname, '../..'),
    express(),
  ).load([
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
    PointModule,
    UploadModule,
    ComplainModule,
  ])

  const manager = container.resolve('manager') as EntityManager

  await manager.transaction(async (tx) => {
    await seedUsers(container, tx)
    await seedCustomers(container, tx)
    await seedProductType(container, tx)
    await seedMaterials(container, tx)
    await seedFulfillmentProvivder(container, tx)
    await seedColors(container, tx)
    await seedProductAddon(container, tx)
    await seedRegion(container, tx)
    await seedShippingOption(container, tx)
    await seedSpecs(container, tx)
  })
}

seed().finally(() => process.exit())
