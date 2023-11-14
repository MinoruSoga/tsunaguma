import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import dayjs from 'dayjs'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, In, LessThan, Not } from 'typeorm'

import { UserCoupon } from '../entities/user-coupon.entity'
import { DiscountRepository } from '../repository/discount.repository'
import { UserCouponRepository } from '../repository/user-coupon.repository'
import { UserDiscountRepository } from '../repository/user-discount.repository'
import { DiscountService } from './discount.service'

type InjectedDependencies = {
  manager: EntityManager
  userCouponRepository: typeof UserCouponRepository
  discountRepository: typeof DiscountRepository
  discountService: DiscountService
  userDiscountRepository: typeof UserDiscountRepository
}

export type UserCouponBody = {
  discount_id: string
  user_id: string
  metadata?: Record<string, unknown>
}
@Service()
export class UserCouponService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'userCouponService'
  protected readonly userCouponRepo_: typeof UserCouponRepository
  protected readonly discountRepo_: typeof DiscountRepository
  protected readonly discountService_: DiscountService
  protected readonly userDiscountRepo_: typeof UserDiscountRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.userCouponRepo_ = container.userCouponRepository
    this.discountRepo_ = container.discountRepository
    this.discountService_ = container.discountService
    this.userDiscountRepo_ = container.userDiscountRepository
  }

  async list(
    selector: Selector<UserCoupon>,
    config: FindConfig<UserCoupon>,
    userId: string,
  ): Promise<[UserCoupon[], number]> {
    const ucRepo = this.manager_.getCustomRepository(this.userCouponRepo_)

    const udRepo = this.manager_.getCustomRepository(this.userDiscountRepo_)
    const usedCoupon = await udRepo.find({ user_id: userId })

    const query = buildQuery(selector, config)

    query.where.user_id = userId
    const couponExpired = await this.getCouponUserExpired(userId)

    query.where.discount_id = Not(In(couponExpired))

    if (usedCoupon?.length > 0) {
      const usedIds = usedCoupon.map((e) => e.discount_id)

      const ids = [].concat(usedIds, couponExpired)

      query.where.discount_id = Not(In(ids))
    }

    const [data, count] = await ucRepo.findAndCount(query)

    await Promise.all(
      data.map(async (e) => {
        return (e.discount = await this.discountService_.getDiscount(
          e.discount_id,
        ))
      }),
    )

    return [data, count]
  }

  async retrieve(userId: string): Promise<[UserCoupon[], number]> {
    const ucRepo = this.manager_.getCustomRepository(this.userCouponRepo_)
    const query = buildQuery(
      { user_id: userId },
      { order: { created_at: 'DESC' } },
    )
    return await ucRepo.findAndCount(query)
  }

  async create(data: UserCouponBody): Promise<UserCoupon> {
    return await this.atomicPhase_(async (manager: EntityManager) => {
      const ucRepo = manager.getCustomRepository(this.userCouponRepo_)
      const disRepo = manager.getCustomRepository(this.discountRepo_)

      const query = buildQuery({ id: data.discount_id, type: 'coupon' }, {})
      const raw = await disRepo.findOne(query)
      if (!raw) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Discount with id ${data.discount_id} not found!`,
        )
      }
      const toCreated = ucRepo.create(data)
      return await ucRepo.save(toCreated)
    })
  }

  async delete(userId: string) {
    const ucRepo = this.manager_.getCustomRepository(this.userCouponRepo_)
    return await ucRepo.delete({ user_id: userId })
  }

  async getCouponUserExpired(id: string): Promise<string[]> {
    return await this.atomicPhase_(async (manager: EntityManager) => {
      const ucRepo = manager.getCustomRepository(this.userCouponRepo_)
      const disRepo = manager.getCustomRepository(this.discountRepo_)

      const ucqr = buildQuery({ user_id: id }, { select: ['discount_id'] })

      const raw = await ucRepo.find(ucqr)

      if (!raw?.length) {
        return []
      }
      const ids = raw.map((e) => e.discount_id)

      const dqr = buildQuery({}, { select: ['id'] })

      dqr.where = [
        {
          id: In(ids),
          ends_at: LessThan(dayjs()),
        },
      ]

      const discounts = await disRepo.find(dqr)

      if (!discounts?.length) {
        return []
      }

      return discounts.map((e) => e.id)
    })
  }
}
