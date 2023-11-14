import { Module } from 'medusa-extender'

import { CartRouter } from './cart.router'
import { ExtendsStorePostCartsCartLineItemsReq } from './controllers/create-line-item.store.controller'
import { ExtendedStorePostCartsCartReq } from './controllers/update-cart.admin.controller'
import { ExtendedStorePostCartsCartLineItemsItemReq } from './controllers/update-line-item.store.controller'
import { Cart } from './entity/cart.entity'
import { LineItem } from './entity/line-item.entity'
import { LineItemAddons } from './entity/line-item-addons.entity'
import { LineItemMigration1666689423171 } from './migrations/1666689423171-line-item.migration'
import { LineItemMigration1668487642871 } from './migrations/1668487642871-line-item.migration'
import { CartMigration1668603596297 } from './migrations/1668603596297-cart.migration'
import { CartMigration1668849101738 } from './migrations/1668849101738-cart.migration'
import { CartMigration1669036516168 } from './migrations/1669036516168-cart.migration'
import { LineItemAddonsRepository } from './repository/line-item-addons.repository'
import { CartService } from './services/cart.service'
import { LineItemService } from './services/line-item.service'
import { LineItemAddonsService } from './services/line-item-addons.service'
import { TotalsService } from './services/totals.service'

@Module({
  imports: [
    LineItem,
    LineItemMigration1666689423171,
    LineItemMigration1668487642871,
    LineItemAddons,
    CartService,
    LineItemService,
    ExtendsStorePostCartsCartLineItemsReq,
    ExtendedStorePostCartsCartLineItemsItemReq,
    LineItemAddonsService,
    LineItemAddonsRepository,
    CartRouter,
    TotalsService,
    CartMigration1668603596297,
    ExtendedStorePostCartsCartReq,
    Cart,
    CartMigration1668849101738,
    CartMigration1669036516168,
  ],
})
export class CartModule {}
