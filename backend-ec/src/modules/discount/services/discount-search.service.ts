import {
  DiscountConditionProduct,
  DiscountConditionProductType,
  TransactionBaseService,
} from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import _ from 'lodash'
import { Service } from 'medusa-extender'
import {
  Between,
  EntityManager,
  ILike,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm'

import { EventBusService } from '../../event/event-bus.service'
import { Product } from '../../product/entity/product.entity'
import ProductRepository from '../../product/repository/product.repository'
import { Store } from '../../store/entity/store.entity'
import { StoreDetail } from '../../store/entity/store-detail.entity'
import StoreRepository from '../../store/repository/store.repository'
import { StoreDetailRepository } from '../../store/repository/store-detail.repository'
import { SearchDiscountBody } from '../controllers/search-discount/search-discount.cms.admin.controller'
import {
  Discount,
  DiscountStatus,
  DiscountType,
  StoreApplyEnum,
} from '../entities/discount.entity'
import { DiscountCondition } from '../entities/discount-condition.entity'
import { DiscountConditionStoreGroup } from '../entities/discount-condition-store-group.entity'
import { DiscountRule } from '../entities/discount-rule.entity'
import { StoreGroupStores } from '../entities/store-group-stores.entity'
import { DiscountRepository } from '../repository/discount.repository'
import { DiscountConditionRepository } from '../repository/discount-condition.repository'
import { DiscountConditionProductRepository } from '../repository/discount-condition-product.repository'
import { DiscountConditionProductTypeRepository } from '../repository/discount-condition-product-type.repository'
import { DiscountConditionStoreGroupRepository } from '../repository/discount-condition-store-group.repository'
import { DiscountRuleRepository } from '../repository/discount-rule.repository'
import { StoreGroupStoresRepository } from '../repository/store-group-stores.repository'

type InjectedDependencies = {
  manager: EntityManager
  eventBusService: EventBusService
  logger: Logger
  discountRepository: typeof DiscountRepository
  discountRuleRepository: typeof DiscountRuleRepository
  storeDetailRepository: typeof StoreDetailRepository
  storeRepository: typeof StoreRepository
  storeGroupStoresRepository: typeof StoreGroupStoresRepository
  discountConditionRepository: typeof DiscountConditionRepository
  productRepository: typeof ProductRepository
  discountConditionStoreGroupRepository: typeof DiscountConditionStoreGroupRepository
  discountConditionProductRepository: typeof DiscountConditionProductRepository
  discountConditionProductTypeRepository: typeof DiscountConditionProductTypeRepository
}

@Service()
export class DiscountSearchService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'discountSearchService'

  protected readonly discountRepo_: typeof DiscountRepository
  protected readonly discountRuleRepo_: typeof DiscountRuleRepository
  protected readonly storeDetailRepo_: typeof StoreDetailRepository
  protected readonly storeRepo_: typeof StoreRepository
  protected readonly storeGroupStoresRepos_: typeof StoreGroupStoresRepository
  protected readonly discountConditionRepo_: typeof DiscountConditionRepository
  protected readonly productRepo_: typeof ProductRepository
  protected readonly discountConditionStoreGroupRepo_: typeof DiscountConditionStoreGroupRepository
  protected readonly discountConditionProductRepo_: typeof DiscountConditionProductRepository
  protected readonly dcProductTypeRepo_: typeof DiscountConditionProductTypeRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.discountRepo_ = container.discountRepository
    this.discountRuleRepo_ = container.discountRuleRepository
    this.storeDetailRepo_ = container.storeDetailRepository
    this.storeRepo_ = container.storeRepository
    this.storeGroupStoresRepos_ = container.storeGroupStoresRepository
    this.discountConditionRepo_ = container.discountConditionRepository
    this.productRepo_ = container.productRepository
    this.discountConditionStoreGroupRepo_ =
      container.discountConditionStoreGroupRepository
    this.discountConditionProductRepo_ =
      container.discountConditionProductRepository
    this.dcProductTypeRepo_ = container.discountConditionProductTypeRepository
  }

  async search(data: SearchDiscountBody): Promise<[Discount[], number]> {
    return await this.atomicPhase_(async (tm) => {
      const discountRepo = tm.getCustomRepository(this.discountRepo_)

      const selector: Selector<Discount> = {
        parent_discount_id: IsNull(),
        type: Not(DiscountType.POINT),
        status: Not(DiscountStatus.DELETED),
      }
      const config: FindConfig<Discount> = {
        relations: ['rule', 'rule.conditions'],
        order: { created_at: 'DESC', display_id: 'DESC' },
      }

      if (data?.limit) {
        config.take = data.limit
      }

      if (data?.offset) {
        config.skip = data.offset
      }

      const query = buildQuery(selector, config)

      if (data?.code) {
        query.where.code = ILike(`%${data.code}%`)
      }

      if (data?.type?.length > 0) {
        query.where.type = In(data.type)
      }

      if (data?.id) {
        query.where.display_id = data.id
      }

      if (data?.amount_from || data?.amount_to) {
        const check = await this.checkRange(data?.amount_from, data?.amount_to)
        if (check === 'dual') {
          query.where.amount_limit = Between(data.amount_from, data.amount_to)
        }
        if (check === 'from') {
          query.where.amount_limit = MoreThanOrEqual(data.amount_from)
        }
        if (check === 'to') {
          query.where.amount_limit = LessThanOrEqual(data.amount_to)
        }
      }

      if (data?.store_apply?.length > 0) {
        const iss = []
        if (data?.store_apply === 'all') {
          iss.push(StoreApplyEnum.ALL)
        }
        if (data?.store_apply === 'store') {
          iss.push(StoreApplyEnum.CSV, StoreApplyEnum.STORE)
        }
        query.where.store_apply = In(iss)
      }

      if (data?.available?.length > 0) {
        const st = []
        if (data.available.some((e) => e === 'yes')) {
          st.push(DiscountStatus.PUBLISHED)
        }
        if (data.available.some((e) => e === 'no')) {
          st.push(DiscountStatus.DELETED)
        }
        query.where.status = In(st)
      }

      if (data?.publisher?.length === 1) {
        if (data?.publisher?.some((e) => e === 'store')) {
          query.where.store_id = Not(IsNull())
        }
        if (data?.publisher?.some((e) => e === 'admin')) {
          query.where.store_id = IsNull()
        }
      }

      if (data?.starts_at && data?.ends_at) {
        const check = await this.checkFromTo(data?.starts_at, data?.ends_at)
        if (check === 'dual') {
          query.where.starts_at = MoreThanOrEqual(data.starts_at)
          query.where.ends_at = LessThanOrEqual(data.ends_at)
        }
        if (check === 'from') {
          query.where.starts_at = MoreThanOrEqual(data.starts_at)
        }
        if (check === 'to') {
          query.where.ends_at = LessThanOrEqual(data.ends_at)
        }
      }

      if (data?.released_from || data?.released_to) {
        const check = await this.checkFromTo(
          data?.released_from,
          data?.released_to,
        )

        if (check === 'dual') {
          query.where.released_at = Between(
            data.released_from,
            data.released_to,
          )
        }

        if (check === 'from') {
          query.where.released_at = MoreThanOrEqual(data.released_from)
        }

        if (check === 'to') {
          query.where.released_at = LessThanOrEqual(data.released_to)
        }
      }

      if (data?.usage_from || data?.usage_to) {
        const check = await this.checkRange(data?.usage_from, data?.usage_to)

        if (check === 'dual') {
          query.where.usage_limit = Between(data.usage_from, data.usage_to)
        }

        if (check === 'from') {
          query.where.usage_limit = MoreThanOrEqual(data.usage_from)
        }

        if (check === 'to') {
          query.where.usage_limit = LessThanOrEqual(data.usage_to)
        }
      }

      if (
        data?.conditions?.length > 0 ||
        data?.store_id ||
        data?.store_name ||
        data?.company_name ||
        data?.furigana ||
        data?.product_id ||
        data?.product_code ||
        data?.product_name ||
        data?.type_id
      ) {
        let ids = []
        let count = 0

        let ids1 = []
        if (data?.conditions?.length > 0) {
          ids1 = await this.getDiscountRule({ conditions: data.conditions })
          count++
        }

        let ids2 = []
        if (
          data?.store_id ||
          data?.store_name ||
          data?.company_name ||
          data?.furigana
        ) {
          ids2 = await this.getDiscountRulesByStore({
            store_id: data?.store_id,
            store_name: data?.store_name,
            company_name: data?.company_name,
            furigana: data?.furigana,
          })
          count++
        }

        let ids3 = []
        if (data?.product_id || data?.product_code || data?.product_name) {
          ids3 = await this.getDiscountRulesByProduct({
            product_id: data?.product_id,
            product_name: data?.product_name,
            product_code: data?.product_code,
          })
          count++
        }

        let ids4 = []
        if (data?.type_id) {
          ids4 = await this.getDiscountByTypes(data.type_id)
          count++
        }

        ids = [].concat(ids1, ids2, ids3, ids4)
        const arr = _.countBy(ids)
        const listIds = []

        for (const key in arr) {
          const element = arr[key]
          if (element === count) {
            listIds.push(key)
          }
        }
        query.where.rule_id = In(listIds)
      }

      return await discountRepo.findAndCount(query)
    })
  }

  async checkRange(from: number, to: number) {
    if (from !== undefined && to !== undefined) {
      return 'dual'
    } else if (from !== undefined) {
      return 'from'
    } else if (to !== undefined) {
      return 'to'
    }
    return 'none'
  }

  async checkFromTo(from: string, to: string) {
    if (from && to) {
      return 'dual'
    } else if (from) {
      return 'from'
    } else if (to) {
      return 'to'
    }
    return 'none'
  }

  async getDiscountRule(data: { conditions?: string[] }): Promise<string[]> {
    return await this.atomicPhase_(async (tm) => {
      const discountRuleRepo = tm.getCustomRepository(this.discountRuleRepo_)

      const se: Selector<DiscountRule> = {}
      const co: FindConfig<DiscountRule> = {
        select: ['id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr = buildQuery(se, co)

      if (data?.conditions?.length > 0) {
        qr.where.type = In(data.conditions)
      }

      const rules = await discountRuleRepo.find(qr)
      if (!(rules?.length > 0)) {
        return []
      }

      return rules.map((e) => e.id)
    })
  }

  async getDiscountRulesByStore(data: {
    store_id?: number
    store_name?: string
    company_name?: string
    furigana?: string
  }): Promise<string[]> {
    return await this.atomicPhase_(async (tm) => {
      const storeDetailRepo = tm.getCustomRepository(this.storeDetailRepo_)
      const storeRepo = tm.getCustomRepository(this.storeRepo_)
      const storeGroupStoresRepo = tm.getCustomRepository(
        this.storeGroupStoresRepos_,
      )
      const dcRepo = tm.getCustomRepository(this.discountConditionRepo_)
      const dcsgRepo_ = tm.getCustomRepository(
        this.discountConditionStoreGroupRepo_,
      )
      const se: Selector<StoreDetail> = {}
      const co: FindConfig<StoreDetail> = {
        select: ['id', 'created_at'],
        order: { created_at: 'DESC' },
      }
      const qr = buildQuery(se, co)
      if (data?.company_name) {
        qr.where.company_name = ILike(`%${data.company_name}%`)
      }

      if (data?.furigana) {
        qr.where.company_name_kana = ILike(`%${data.furigana}%`)
      }

      const storeDetail = await storeDetailRepo.find(qr)
      if (!(storeDetail?.length > 0)) {
        return []
      }

      const se1: Selector<Store> = {}
      const co1: FindConfig<Store> = {
        select: ['id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr1 = buildQuery(se1, co1)
      if (data?.store_id) {
        qr1.where.display_id = data.store_id
      }

      if (data?.store_name) {
        qr1.where.name = ILike(`%${data.store_name}%`)
      }

      const sdids = storeDetail.map((e) => e.id)
      qr1.where.store_detail_id = In(sdids)

      const stores = await storeRepo.find(qr1)

      if (!(stores?.length > 0)) {
        return []
      }

      const sids = stores.map((e) => e.id)

      const se2: Selector<StoreGroupStores> = {}
      const co2: FindConfig<StoreGroupStores> = {
        select: ['store_group_id'],
      }

      const qr2 = buildQuery(se2, co2)
      qr2.where.store_id = In(sids)

      const storeGroups = await storeGroupStoresRepo.find(qr2)
      if (!(storeGroups?.length > 0)) {
        return []
      }

      const se3: Selector<DiscountConditionStoreGroup> = {}
      const co3: FindConfig<DiscountConditionStoreGroup> = {
        select: ['condition_id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr3 = buildQuery(se3, co3)

      const sgids = storeGroups.map((e) => e.store_group_id)

      qr3.where.store_group_id = In(sgids)
      const conditions = await dcsgRepo_.find(qr3)
      if (!(conditions?.length > 0)) {
        return []
      }

      const se4: Selector<DiscountCondition> = {}
      const co4: FindConfig<DiscountCondition> = {
        select: ['discount_rule_id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr4 = buildQuery(se4, co4)
      const cids = conditions.map((e) => e.condition_id)
      qr4.where.id = In(cids)

      const rules = await dcRepo.find(qr4)
      if (!(rules?.length > 0)) {
        return []
      }
      return rules.map((e) => e.discount_rule_id)
    })
  }

  async getDiscountRulesByProduct(data: {
    product_id?: number
    product_code?: string
    product_name?: string
  }): Promise<string[]> {
    return await this.atomicPhase_(async (tm) => {
      const productRepo = tm.getCustomRepository(this.productRepo_)
      const dcpRepo = tm.getCustomRepository(this.discountConditionProductRepo_)
      const dcRepo = tm.getCustomRepository(this.discountConditionRepo_)

      const se: Selector<Product> = {}
      const co: FindConfig<Product> = {
        select: ['id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr = buildQuery(se, co)
      if (data?.product_id) {
        qr.where.display_id = data.product_id
      }

      if (data?.product_code) {
        qr.where.display_code = ILike(`%${data.product_code}%`)
      }

      if (data?.product_name) {
        qr.where.title = ILike(`%${data.product_name}%`)
      }

      const products = await productRepo.find(qr)

      if (!(products?.length > 0)) {
        return []
      }

      const pids = products.map((e) => e.id)

      const se1: Selector<DiscountConditionProduct> = {}
      const co1: FindConfig<DiscountConditionProduct> = {
        select: ['condition_id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr1 = buildQuery(se1, co1)
      qr1.where.product_id = In(pids)

      const conditions = await dcpRepo.find(qr1)
      if (!(conditions?.length > 0)) {
        return []
      }

      const cids = conditions.map((e) => e.condition_id)

      const se2: Selector<DiscountCondition> = {}
      const co2: FindConfig<DiscountCondition> = {
        select: ['discount_rule_id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr2 = buildQuery(se2, co2)
      qr2.where.id = In(cids)

      const rules = await dcRepo.find(qr2)
      if (!(rules?.length > 0)) {
        return []
      }
      return rules.map((e) => e.discount_rule_id)
    })
  }

  async getDiscountByTypes(typeId: string): Promise<string[]> {
    return await this.atomicPhase_(async (tm) => {
      const dcRepo = tm.getCustomRepository(this.discountConditionRepo_)
      const dcProductTypeRepo = tm.getCustomRepository(this.dcProductTypeRepo_)

      const se: Selector<DiscountConditionProductType> = {}
      const co: FindConfig<DiscountConditionProductType> = {
        select: ['condition_id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr = buildQuery(se, co)
      qr.where.product_type_id = typeId

      const conditions = await dcProductTypeRepo.find(qr)

      if (!(conditions?.length > 0)) {
        return []
      }

      const cids = conditions.map((e) => e.condition_id)

      const sel: Selector<DiscountCondition> = {}
      const cog: FindConfig<DiscountCondition> = {
        select: ['discount_rule_id', 'created_at'],
        order: { created_at: 'DESC' },
      }

      const qr2 = buildQuery(sel, cog)
      qr2.where.id = In(cids)

      const rules = await dcRepo.find(qr2)
      if (!(rules?.length > 0)) {
        return []
      }
      return rules.map((e) => e.discount_rule_id)
    })
  }
}
