/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  EventBusService,
  OrderStatus,
  TransactionBaseService,
} from '@medusajs/medusa'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { Logger } from 'medusa-extender/dist/core'
import { ProductService } from 'src/modules/product/services/product.service'
import { DeepPartial, EntityManager, In, IsNull, Not } from 'typeorm'

import { EmailTemplateData } from '../../../interfaces/email-template'
import { OrderCancelStatus } from '../../order/entity/order.entity'
import { OrderRepository } from '../../order/repository/order.repository'
import { OrderService } from '../../order/services/order.service'
import ProductRepository from '../../product/repository/product.repository'
import { StoreStatus } from '../../store/entity/store.entity'
import StoreService from '../../store/services/store.service'
import { UserStatus } from '../../user/entity/user.entity'
import { CreateWithdrawalReq } from '../controllers/withdrawal/create-withdrawal.admin.controller'
import { UserType } from '../entity/user.entity'
import { Withdrawal, WithdrawalStatus } from '../entity/withdrawal.entity'
import {
  WithdrawalReason,
  WithdrawalReasonType,
} from '../entity/withdrawnal-reason.entity'
import { UserWithdrawalReasonRepository } from '../repository/user-withdrawal-reason.repository'
import { WithdrawalRepository } from '../repository/withdrawal.repository'
import { WithdrawalReasonRepository } from '../repository/withdrawal-reason.repository'
import UserService from './user.service'

type ConstructorParams = {
  manager: EntityManager
  withdrawalRepository: typeof WithdrawalRepository
  withdrawalReasonRepository: typeof WithdrawalReasonRepository
  userWithdrawalReasonRepository: typeof UserWithdrawalReasonRepository
  logger: Logger
  userService: UserService
  storeService: StoreService
  productService: ProductService
  eventBusService: EventBusService
  orderService: OrderService
  orderRepository: typeof OrderRepository
  productRepository: typeof ProductRepository
}

@Service()
export default class WithdrawalService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager

  protected userService_: UserService
  protected storeService_: StoreService
  protected logger_: Logger
  protected withdrawalRepo_: typeof WithdrawalRepository
  protected withdrawalReasonRepo_: typeof WithdrawalReasonRepository
  protected userWithdrawalReasonRepo_: typeof UserWithdrawalReasonRepository
  protected orderRepo_: typeof OrderRepository
  protected productRepo_: typeof ProductRepository
  protected eventBus_: EventBusService
  protected orderService_: OrderService
  protected productService_: ProductService

  static resolutionKey = 'withdrawalService'

  static Events = {
    CREATED: 'withdrawal.created',
  }

  constructor(private readonly container: ConstructorParams) {
    super(container)
    this.userService_ = container.userService
    this.storeService_ = container.storeService
    this.logger_ = container.logger
    this.withdrawalRepo_ = container.withdrawalRepository
    this.withdrawalReasonRepo_ = container.withdrawalReasonRepository
    this.userWithdrawalReasonRepo_ = container.userWithdrawalReasonRepository
    this.eventBus_ = container.eventBusService
    this.manager_ = container.manager
    this.transactionManager_ = container.manager
    this.orderService_ = container.orderService
    this.productService_ = container.productService
    this.orderRepo_ = container.orderRepository
    this.productRepo_ = container.productRepository
  }

  async getReasons(type?: WithdrawalReasonType): Promise<WithdrawalReason[]> {
    const withdrawalReasonRepo = this.manager_.getCustomRepository(
      this.withdrawalReasonRepo_,
    )
    const params = type ? { reason_type: type } : {}
    const result = await withdrawalReasonRepo.find(params)

    return result
  }

  async checkWithdraw(userId: string): Promise<boolean> {
    const orderRepo = this.manager_.getCustomRepository(this.orderRepo_)
    const user = await this.userService_.retrieve(userId, {
      select: ['id', 'store_id', 'type'],
      relations: ['store'],
    })

    // customer or shop premium
    if (user.type === UserType.CUSTOMER || user.type === UserType.STORE_PRIME)
      return true

    // shop standard
    if (user.type === UserType.STORE_STANDARD) {
      const order = await orderRepo.findOne({
        where: [
          {
            store_id: user.store_id,
            status: OrderStatus.PENDING,
            parent_id: Not(IsNull()),
          },
          {
            parent_id: Not(IsNull()),
            store_id: user.store_id,
            status: OrderStatus.CANCELED,
            cancel_status: OrderCancelStatus.PENDING,
          },
        ],
        select: ['id'],
      })

      if (!order) return true
    }

    return false
  }

  async withdraw(userId: string): Promise<void> {
    return this.atomicPhase_(async (tx) => {
      const user = await this.userService_
        .withTransaction(tx)
        .retrieve(userId, {
          select: ['id', 'type', 'store_id'],
        })
      // if this user is store standard
      // hide store => can not access (change shop status to rejected)
      const isShopOwner =
        user.type === UserType.STORE_PRIME ||
        user.type === UserType.STORE_STANDARD
      if (isShopOwner) {
        // change shop status to rejected
        await this.storeService_
          .withTransaction(tx)
          .changeStatus(user.store_id, StoreStatus.REJECTED, false, true)

        // change status of shop to deleted
        await this.productService_
          .withTransaction(tx)
          .changeStatusWithdraw(user.store_id, true, true)
      }

      // change user status from active to inactive
      await this.userService_
        .withTransaction(tx)
        .update_(userId, { status: UserStatus.INACTIVE })
    })
  }

  async restoreData(userId: string): Promise<void> {
    return this.atomicPhase_(async (tx) => {
      // change user status from inactive to active
      await this.userService_
        .withTransaction(tx)
        .update_(userId, { status: UserStatus.ACTIVE })

      const user = await this.userService_
        .withTransaction(tx)
        .retrieve(userId, {
          select: ['id', 'type', 'store_id'],
          relations: ['store'],
        })

      const isShopOwner =
        user.type === UserType.STORE_PRIME ||
        user.type === UserType.STORE_STANDARD
      if (isShopOwner) {
        // restore shop status
        await this.storeService_
          .withTransaction(tx)
          .changeStatus(user.store.id, user.store.old_status, false, true)

        // restore product status of shop
        await this.productService_
          .withTransaction(tx)
          .changeStatusWithdraw(user.store_id, false, true)
      }
    })
  }

  // withdraw request
  async create(userId: string, data: CreateWithdrawalReq): Promise<Withdrawal> {
    return this.atomicPhase_(async (tx) => {
      const user = await this.userService_
        .withTransaction(tx)
        .retrieve(userId, {
          select: ['id', 'store_id', 'type', 'customer', 'email', 'nickname'],
          relations: ['store', 'customer'],
        })
      const isPrime = user.type === UserType.STORE_PRIME

      const withdrawalRepo = tx.getCustomRepository(this.withdrawalRepo_)

      // if already withdrawn or in pending status
      const record = await withdrawalRepo.findOne({
        where: {
          user_id: userId,
          status: In([WithdrawalStatus.APPROVED, WithdrawalStatus.PENDING]),
        },
      })

      if (record && !isPrime) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Withdrawal is not allowed!',
        )
      }

      // check if this user can withdrawn
      const canWithdraw = await this.withTransaction(tx).checkWithdraw(userId)
      if (!canWithdraw) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Withdrawal is not allowed!',
        )
      }

      const userWithdrawalReasonRepo = tx.getCustomRepository(
        this.userWithdrawalReasonRepo_,
      )

      const { reasons, ...rest } = data
      const toCreateData = (() => {
        if (isPrime && record) return Object.assign(record, rest)

        return { ...rest }
      })()
      const toCreate: DeepPartial<Withdrawal> =
        withdrawalRepo.create(toCreateData)

      // populate store id and user id
      toCreate.user_id = user.id
      if (user.store_id) toCreate.store_id = user.store_id

      // for shop premium
      toCreate.status = isPrime
        ? WithdrawalStatus.PENDING
        : WithdrawalStatus.APPROVED

      // create withdrawal
      const withdrawal = await withdrawalRepo.save(toCreate)

      // if user is premium and already registered withdrawal request => delete old reasons
      if (isPrime && record) {
        await userWithdrawalReasonRepo.delete({ withdrawal_id: record.id })
      }

      // populate store reason
      await Promise.all(
        reasons.map(async (reasonId) => {
          await userWithdrawalReasonRepo.save(
            userWithdrawalReasonRepo.create({
              withdrawal_id: withdrawal.id,
              withdrawal_reason_id: reasonId,
            }),
          )
        }),
      )

      const withdrawalReasons = await this.withTransaction(tx).getReasons(
        isPrime ? WithdrawalReasonType.PREMIUM : WithdrawalReasonType.STANDARD,
      )

      // TODO: change shop status, product status, user status, emit events
      if (!isPrime) {
        await this.withTransaction(tx).withdraw(userId)
      }

      const emailReasons = reasons
        .map((r) => withdrawalReasons.find((wdr) => wdr.id === r)?.value)
        .filter((r) => !!r)

      const emailData = {
        id: user?.customer?.display_id,
        nickname: user.nickname,
        note: data.note,
        reasons: emailReasons,
        store_id: user?.store?.display_id,
      }

      // send email part => Tu Anh
      if (isPrime) {
        await this.eventBus_
          .withTransaction(tx)
          .emit(WithdrawalService.Events.CREATED, {
            id: user.id,
            email: user.email,
            format: 'withdrawal-premium-created',
            customer_id: user.id,
            data: emailData,
          })
      } else {
        await this.eventBus_
          .withTransaction(tx)
          .emit(WithdrawalService.Events.CREATED, {
            id: user.id,
            email: user.email,
            // customer_id: user.id,
            format: 'withdrawal-customer-created',
            data: {
              isStore: user.type === UserType.CUSTOMER ? false : true,
              ...emailData,
            },
          })
      }

      return withdrawal
    })
  }

  // remove withdraw (restore this user)
  async restore(userId: string): Promise<void> {
    return this.atomicPhase_(async (tx) => {
      const withdrawalRepo = tx.getCustomRepository(this.withdrawalRepo_)

      const user = await this.userService_.withTransaction(tx).retrieve(
        userId,
        {
          select: ['id', 'store_id', 'type', 'status', 'email'],
          relations: ['store'],
        },
        false,
      )

      if (user.status !== UserStatus.INACTIVE) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Restore is not allowed!',
        )
      }

      // check if already withdrawn or not
      const record = await withdrawalRepo.findOne({
        where: {
          user_id: userId,
          status: WithdrawalStatus.APPROVED,
        },
      })
      if (!record) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Restore is not allowed!',
        )
      }

      // check if this user's email is used or not
      const isEmailExist = await this.userService_
        .withTransaction(tx)
        .isEmailExist(user.email)

      if (isEmailExist) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          'User with this email already exist',
        )
      }

      // delete withdrawn record
      await withdrawalRepo.remove([record])

      // restore all data of this user
      await this.withTransaction(tx).restoreData(userId)
    })
  }

  // approve withdrawal request
  async approve(userId: string): Promise<void> {
    return this.atomicPhase_(async (tx) => {
      const withdrawalRepo = tx.getCustomRepository(this.withdrawalRepo_)
      const user = await this.userService_
        .withTransaction(tx)
        .retrieve(userId, {
          select: ['id', 'store_id', 'type', 'status', 'email'],
          relations: ['store'],
        })
      const isPrime = user.type === UserType.STORE_PRIME

      if (!isPrime) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'This user is not premium',
        )
      }

      // check if this user have pending request or not
      const record = await withdrawalRepo.findOne({
        where: {
          user_id: userId,
          status: WithdrawalStatus.PENDING,
        },
      })
      if (!record) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Approve is not allowed!',
        )
      }

      // check if this user can withdrawn
      const canWithdraw = await this.withTransaction(tx).checkWithdraw(userId)
      if (!canWithdraw) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          'Withdrawal is not allowed!',
        )
      }

      // change status from pending to approved
      record.status = WithdrawalStatus.APPROVED
      await withdrawalRepo.save(record)

      // approve withdrawn
      await this.withTransaction(tx).withdraw(userId)
    })
  }

  async genEmailData(
    event: string,
    data: WithdrawalEmailData,
  ): Promise<EmailTemplateData> {
    return {
      to: data.email,
      format: data.format,
      data: data.data,
      customer_id: data.customer_id ?? null,
    }
  }
}

interface WithdrawalEmailData {
  id: string
  format: string
  email: string
  data: object
  customer_id?: string
}
