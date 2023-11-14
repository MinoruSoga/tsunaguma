import { Module } from 'medusa-extender'

import { DiscountRouter } from './discount.router'
import { CustomerGroupCustomers } from './entities/customer-group-customers.entity'
import { Discount } from './entities/discount.entity'
import { DiscountCondition } from './entities/discount-condition.entity'
import { DiscountConditionStoreGroup } from './entities/discount-condition-store-group.entity'
import { DiscountHistory } from './entities/discount-history.entity'
import { DiscountRule } from './entities/discount-rule.entity'
import { OrderDiscounts } from './entities/order-discounts.entity'
import { PromotionCodeMaster } from './entities/promotion-code-master.entity'
import { StoreGroup } from './entities/store-group.entity'
import { StoreGroupStores } from './entities/store-group-stores.entity'
import { UserCoupon } from './entities/user-coupon.entity'
import { UserDiscount } from './entities/user-discount.entity'
import { DiscountMigration1670857911456 } from './migrations/1670857911456-discount.migration'
import { DiscountMigration1671869896726 } from './migrations/1671869896726-discount.migration'
import { DiscountMigration1673023008076 } from './migrations/1673023008076-discount.migration'
import { DiscountMigration1673254062646 } from './migrations/1673254062646-discount.migration'
import { DiscountMigration1679318482165 } from './migrations/1679318482165-discount.migration'
import { DiscountMigration1682091367322 } from './migrations/1682091367322-discount.migration'
import { DiscountMigration1682150462349 } from './migrations/1682150462349-discount.migration'
import { DiscountMigration1683686575506 } from './migrations/1683686575506-discount.migration'
import { UserCouponMigration1683774232926 } from './migrations/1683774232926-user_coupon.migration'
import { DiscountMigration1684382526939 } from './migrations/1684382526939-discount.migration'
import { DiscountMigration1685421217527 } from './migrations/1685421217527-discount.migration'
import { DiscountMigration1685941179973 } from './migrations/1685941179973-discount.migration'
import { DiscountMigration1685978419743 } from './migrations/1685978419743-discount.migration'
import { DiscountMigration1686025894653 } from './migrations/1686025894653-discount.migration'
import { DiscountMigration1689059001989 } from './migrations/1689059001989-discount.migration'
import { CustomerGroupCustomersRepository } from './repository/customer-group-customers.repository'
import { DiscountRepository } from './repository/discount.repository'
import { DiscountConditionRepository } from './repository/discount-condition.repository'
import { DiscountConditionProductRepository } from './repository/discount-condition-product.repository'
import { DiscountConditionProductTypeRepository } from './repository/discount-condition-product-type.repository'
import { DiscountConditionStoreGroupRepository } from './repository/discount-condition-store-group.repository'
import { DiscountHistoryRepository } from './repository/discount-history.repository'
import { DiscountRuleRepository } from './repository/discount-rule.repository'
import { OrderDiscountsRepository } from './repository/order-discounts.repository'
import { PromotionCodeMasterRepository } from './repository/promotion-code-master.repository'
import { StoreGroupRepository } from './repository/store-group.repository'
import { StoreGroupStoresRepository } from './repository/store-group-stores.repository'
import { UserCouponRepository } from './repository/user-coupon.repository'
import { UserDiscountRepository } from './repository/user-discount.repository'
import { DiscountService } from './services/discount.service'
import { DiscountConditionService } from './services/discount-condition.service'
import { DiscountHistoryService } from './services/discount-history.service'
import { DiscountSearchService } from './services/discount-search.service'
import { PromotionCodeMasterService } from './services/promotion-code-master.service'
import { StoreGroupService } from './services/store-group.service'
import { UserCouponService } from './services/user-coupon.service'
import { DiscountSubscriber } from './subscribers/discount.subscriber'

@Module({
  imports: [
    Discount,
    DiscountMigration1670857911456,
    DiscountService,
    DiscountRepository,
    UserDiscountRepository,
    DiscountRouter,
    DiscountMigration1671869896726,
    DiscountMigration1673023008076,
    UserDiscount,
    DiscountSubscriber,
    DiscountMigration1673254062646,
    DiscountMigration1679318482165,
    PromotionCodeMaster,
    DiscountMigration1682091367322,
    PromotionCodeMasterRepository,
    DiscountMigration1682150462349,
    PromotionCodeMasterService,
    DiscountMigration1683686575506,
    DiscountConditionStoreGroup,
    UserCouponMigration1683774232926,
    StoreGroupRepository,
    UserCoupon,
    UserCouponRepository,
    UserCouponService,
    StoreGroupService,
    DiscountConditionService,
    DiscountConditionRepository,
    DiscountCondition,
    StoreGroup,
    DiscountRule,
    DiscountRuleRepository,
    DiscountMigration1684382526939,
    StoreGroupStores,
    StoreGroupStoresRepository,
    CustomerGroupCustomers,
    CustomerGroupCustomersRepository,
    DiscountMigration1685421217527,
    DiscountMigration1685941179973,
    DiscountHistoryRepository,
    DiscountHistory,
    DiscountHistoryService,
    DiscountConditionStoreGroupRepository,
    DiscountConditionProductRepository,
    DiscountMigration1685978419743,
    DiscountSearchService,
    DiscountConditionProductTypeRepository,
    DiscountMigration1686025894653,
    OrderDiscountsRepository,
    OrderDiscounts,
    DiscountMigration1689059001989,
  ],
})
export class DiscountModule {}
