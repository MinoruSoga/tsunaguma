import { Module } from 'medusa-extender'

import {
  ExtendedAddressCreatePayload,
  ExtendedStorePostCustomersCustomerAddressesReq,
} from './controllers/address/create-address.store.controller'
import { AdminUpdateUserReq } from './controllers/update-user.admin.controller'
import { Address } from './entity/address.entity'
import { Customer } from './entity/customer.entity'
import { GmoMember } from './entity/gmo-member.entity'
import { ResourceTracking } from './entity/resource-tracking.entity'
import { User } from './entity/user.entity'
import { UserHistory } from './entity/user-history.entity'
import { UserWithdrawalReason } from './entity/user-withdrawal-reason.entity'
import { Withdrawal } from './entity/withdrawal.entity'
import { WithdrawalReason } from './entity/withdrawnal-reason.entity'
import { LoggedInUserMiddleware } from './middlewares/logged-in-user.middleware'
import { RegisterMiddleware } from './middlewares/register.middleware'
import { ResetPasswordMiddleware } from './middlewares/reset-password.middleware'
import { StoreStandardMiddleware } from './middlewares/store-standard.middleware'
import { AttachUserSubscriberMiddleware } from './middlewares/user-subscriber.middleware'
import { UserMigration1666953228393 } from './migrations/1666953228393-user.migration'
import { UserMigration1667188147301 } from './migrations/1667188147301-user.migration'
import { UserMigration1668597812362 } from './migrations/1668597812362-user.migration'
import { CustomerMigration1669026484235 } from './migrations/1669026484235-customer.migration'
import { GmoMemberMigration1669256429376 } from './migrations/1669256429376-gmo_member.migration'
import { UserMigration1670319600558 } from './migrations/1670319600558-user.migration'
import { AddressMigration1670384503209 } from './migrations/1670384503209-address.migration'
import { UserMigration1671165018472 } from './migrations/1671165018472-user.migration'
import { UserMigration1671253875618 } from './migrations/1671253875618-user.migration'
import { UserMigration1671355221131 } from './migrations/1671355221131-user.migration'
import { UserMigration1673592795281 } from './migrations/1673592795281-user.migration'
import { UserMigration1675947547227 } from './migrations/1675947547227-user.migration'
import { UserMigration1676390092979 } from './migrations/1676390092979-user.migration'
import { UserMigration1678889158630 } from './migrations/1678889158630-user.migration'
import { UserMigration1679632209609 } from './migrations/1679632209609-user.migration'
import { UserMigration1679888409551 } from './migrations/1679888409551-user.migration'
import { UserMigration1682050868080 } from './migrations/1682050868079-user.migration'
import { UserMigration1684229975736 } from './migrations/1684229975736-user.migration'
import { CustomerMigration1695608409697 } from './migrations/1695608409697-customer.migration'
import { UserMigration1695627036898 } from './migrations/1695627036898-user.migration'
import { CustomerMigration1695627050355 } from './migrations/1695627050355-customer.migration'
import { CustomerRepository } from './repository/customer.repository'
import { GmoMemberRepository } from './repository/gmo-member.repository'
import { ResourceTrackingRepository } from './repository/resoure-tracking.repository'
import { UserHistoryRepository } from './repository/user-history.repository'
import { UserWithdrawalReasonRepository } from './repository/user-withdrawal-reason.repository'
import { WithdrawalRepository } from './repository/withdrawal.repository'
import { WithdrawalReasonRepository } from './repository/withdrawal-reason.repository'
import AuthService from './services/auth.service'
import CustomerService from './services/customer.service'
import { GmoService } from './services/gmo.service'
import UserService from './services/user.service'
import { UserHistoryService } from './services/user-history.service'
import { UserSearchService } from './services/user-search.service'
import WithdrawalService from './services/withdrawal.service'
import UserRepository from './user.repository'
import { UserRouter } from './user.router'

@Module({
  imports: [
    User,
    UserService,
    CustomerService,
    AuthService,
    Customer,
    UserRepository,
    UserRouter,
    LoggedInUserMiddleware,
    RegisterMiddleware,
    AttachUserSubscriberMiddleware,
    ResetPasswordMiddleware,
    StoreStandardMiddleware,
    UserMigration1666953228393,
    UserMigration1667188147301,
    ExtendedStorePostCustomersCustomerAddressesReq,
    AddressMigration1670384503209,
    Address,
    UserMigration1668597812362,
    CustomerMigration1669026484235,
    AdminUpdateUserReq,
    GmoMemberMigration1669256429376,
    UserMigration1670319600558,
    GmoService,
    GmoMemberRepository,
    GmoMember,
    UserMigration1671165018472,
    ExtendedAddressCreatePayload,
    UserMigration1671253875618,
    UserHistoryRepository,
    UserHistory,
    UserHistoryService,
    UserMigration1671355221131,
    UserMigration1673592795281,
    UserMigration1675947547227,
    UserMigration1676390092979,
    UserSearchService,
    ResourceTracking,
    ResourceTrackingRepository,
    UserMigration1678889158630,

    // Withdrawal
    Withdrawal,
    WithdrawalReason,
    UserWithdrawalReason,
    UserMigration1679632209609,
    UserWithdrawalReasonRepository,
    WithdrawalReasonRepository,
    WithdrawalRepository,
    WithdrawalService,
    UserMigration1679888409551,
    UserMigration1682050868080,
    UserMigration1684229975736,
    CustomerRepository,
    CustomerMigration1695608409697,
    UserMigration1695627036898,
    CustomerMigration1695627050355,
  ],
})
export class UserModule {}
