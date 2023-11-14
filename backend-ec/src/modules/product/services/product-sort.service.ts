/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ProductStatus, TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, FindManyOptions, In, Not } from 'typeorm'

import { Store } from '../../store/entity/store.entity'
import StoreRepository from '../../store/repository/store.repository'
import StoreService from '../../store/services/store.service'
import { SortType } from '../controllers/sort-product.admin.controller'
import { Product } from '../entity/product.entity'
import ProductRepository from '../repository/product.repository'

type InjectedDependencies = {
  manager: EntityManager
  storeService: StoreService
  productRepository: typeof ProductRepository
  storeRepository: typeof StoreRepository
  logger: Logger
}

// default: created_at: desc, shop_rank: asc
// const sortStatus = [ProductStatus.PROPOSED, ProductStatus.PUBLISHED]

function checkConsecutive(nums: number[]) {
  const sortedNums = [...nums].sort((a, b) => a - b)
  for (let i = 1; i < sortedNums.length; i++) {
    if (sortedNums[i - 1] + 1 !== sortedNums[i]) return false
  }

  return true
}

@Service()
export class ProductSortService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  protected productRepo_: typeof ProductRepository
  protected storeService_: StoreService
  protected storeRepo_: typeof StoreRepository
  private logger_: Logger
  static resolutionKey = 'productSortService'

  constructor(container: InjectedDependencies) {
    super(container)

    this.container_ = container
    this.productRepo_ = container.productRepository
    this.manager_ = container.manager
    this.storeService_ = container.storeService
    this.logger_ = container.logger
    this.storeRepo_ = container.storeRepository
  }

  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ProductSortService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ProductSortService({
      ...this.container_,
      manager: transactionManager,
    })

    cloned.manager_ = transactionManager

    return cloned
  }

  async listSortProducts(
    storeId: string,
    selector: Selector<Product>,
    config: FindConfig<Product>,
  ) {
    const productRepo = this.manager_.getCustomRepository(this.productRepo_)

    const query: FindManyOptions<Product> = buildQuery(selector, config)

    query.where = {
      store_id: storeId,
      status: selector.status,
    }

    query.order = { shop_rank: 'ASC', created_at: 'DESC' }

    return await productRepo.findAndCount(query)
  }

  // init rank in reverse order with created at
  async initRank(storeId: string) {
    return this.atomicPhase_(async (transactionManager) => {
      this.logger_.info('Init product rank for shop ==> ' + storeId)
      const productRepo = transactionManager.getCustomRepository(
        this.productRepo_,
      )

      const proposedProducts = await productRepo.find({
        where: { status: ProductStatus.PROPOSED, store_id: storeId },
        order: { created_at: 'DESC' },
      })
      await Promise.all(
        proposedProducts.map(async (product, idx) => {
          await productRepo.update({ id: product.id }, { shop_rank: idx + 1 })
        }),
      )

      const publishedProducts = await productRepo.find({
        where: { status: ProductStatus.PUBLISHED, store_id: storeId },
        order: { created_at: 'DESC' },
      })
      await Promise.all(
        publishedProducts.map(async (product, idx) => {
          await productRepo.update({ id: product.id }, { shop_rank: idx + 1 })
        }),
      )

      // mark this store as already init rank
      await this.storeService_
        .withTransaction(transactionManager)
        // @ts-ignore
        .update_(storeId, { init_rank: true })
    })
  }

  async checkInitRank(storeId: string): Promise<boolean> {
    const store = await this.storeService_.retrieve_(storeId, {
      select: ['init_rank'],
    })
    return store.init_rank
  }

  // put new item in the first or last position
  async insertNewRank(
    storeId: string,
    status: ProductStatus,
    productId: string,
    position: 'last' | 'first' = 'first',
  ) {
    return this.atomicPhase_(async (transactionManager) => {
      const productRepo = transactionManager.getCustomRepository(
        this.productRepo_,
      )
      const qb = productRepo.createQueryBuilder('product')

      if (position === 'first') {
        await qb
          .update(Product)
          .set({
            shop_rank: () => `product.shop_rank + 1`,
          })
          .where({ store_id: storeId })
          .andWhere({ status })
          .execute()
        await qb
          .update(Product)
          .set({ shop_rank: 1 })
          .where({ id: productId })
          .execute()
        return
      }

      const total = await productRepo.count({
        where: { status, store_id: storeId },
      })

      // newly inserted product will have highest rank
      await productRepo.update({ id: productId }, { shop_rank: total })
    })
  }

  async removeRankByStatus(
    storeId: string,
    status: ProductStatus,
    productId: string,
  ) {
    const productRepo = this.manager_.getCustomRepository(this.productRepo_)
    const qb = productRepo.createQueryBuilder('product')

    const product = await productRepo.findOne(
      { id: productId },
      { select: ['id', 'shop_rank', 'status'] },
    )

    await qb
      .update(Product)
      .set({
        shop_rank: () => `product.shop_rank - 1`,
      })
      .where({ store_id: storeId })
      .andWhere({ status })
      .andWhere('(product.shop_rank > :rank)', { rank: product.shop_rank })
      .execute()
  }

  async swapRank(ids: string[], limit: number) {
    return this.atomicPhase_(async (transactionManager) => {
      if (!ids.length) return

      const productRepo = transactionManager.getCustomRepository(
        this.productRepo_,
      )

      let products = await productRepo.find({
        where: { id: In(ids) },
        select: ['id', 'shop_rank', 'store_id'],
      })

      if (!products.length) return

      // check if store inited rank or not
      // if not init rank first
      const isInitRank = await this.withTransaction(
        transactionManager,
      ).checkInitRank(products[0].store_id)
      if (!isInitRank) {
        await this.withTransaction(transactionManager).initRank(
          products[0].store_id,
        )
        products = await productRepo.find({
          where: { id: In(ids) },
          select: ['id', 'shop_rank', 'store_id'],
        })
      }

      this.logger_.info(
        'Swap rank: ' +
          products[0].store_id +
          products.map((p) => p.id) +
          ', ' +
          products.map((p) => p.shop_rank),
      )

      const ranks = products.map((p) => p.shop_rank as number)
      const minRank = Math.min(...ranks)

      const uniqueRanks = new Set(ranks)

      if (uniqueRanks.size !== ranks.length)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Ranks are not unique: ' + products[0].store_id,
        )

      if (!checkConsecutive(ranks))
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Ranks are not consecutive: ' + products[0].store_id,
        )

      if ((minRank - 1) % limit !== 0)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Ranks are not on same page: ' + products[0].store_id,
        )

      await Promise.all(
        ids.map(async (id, idx) => {
          const p = products.find((i) => i.id === id)
          const newRank = minRank + idx
          if (p.shop_rank === newRank) return

          await productRepo.update({ id }, { shop_rank: newRank })
        }),
      )
    })
  }

  async updateRankPagination(
    storeId: string,
    status: ProductStatus,
    type: SortType,
    ids: string[],
    limit = 10,
  ) {
    return this.atomicPhase_(async (transactionManager) => {
      const productRepo = transactionManager.getCustomRepository(
        this.productRepo_,
      )

      if (!ids.length || ids.length > limit) return

      const isInitRank = await this.withTransaction(
        transactionManager,
      ).checkInitRank(storeId)
      if (!isInitRank) {
        await this.withTransaction(transactionManager).initRank(storeId)
      }

      this.logger_.info(
        'Update rank pagination: ' + storeId + ', type:  ' + type,
      )

      // some validation
      if (ids.length > limit)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Number of items can not greater than limit',
        )

      // get all products of this store which have status = status
      const products = await productRepo.find({
        where: { status, store_id: storeId },
        select: ['id', 'status', 'shop_rank', 'store_id'],
        order: { shop_rank: 'ASC' },
      })

      if (ids.some((id) => !products.find((p) => p.id === id)))
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Product id not found in this store with status = ' + status,
        )

      const movedIds = products
        .filter((p) => ids.includes(p.id))
        .map((p) => p.id)
      const leftIds = products
        .filter((p) => !ids.includes(p.id))
        .map((p) => p.id)
      const totalPages = Math.ceil(products.length / limit)
      // const firstPageIds = products.slice(0, limit).map((p) => p.id)
      const lastPageIds = products
        .slice((totalPages - 1) * limit)
        .map((p) => p.id)

      const movedPage = Math.ceil(
        (products.findIndex((p) => p.id === movedIds[0]) + 1) / limit,
      )
      const movedPageIds = products
        .slice((movedPage - 1) * limit, movedPage * limit)
        .map((p) => p.id)

      if (ids.some((id) => !movedPageIds.find((i) => i === id)))
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Id not belong to moved page ids',
        )

      switch (type) {
        case SortType.FIRST:
          // already on first page
          if (movedPage === 1) return

          await Promise.all(
            movedIds.concat(leftIds).map(async (id, idx) => {
              await productRepo.update({ id }, { shop_rank: idx + 1 })
            }),
          )

          break

        case SortType.LAST:
          if (movedPage === totalPages) {
            // already in last page
            return
          }

          const lastPart = [
            ...lastPageIds.slice(0, movedIds.length),
            ...movedIds,
            ...lastPageIds.slice(movedIds.length),
          ]

          const orderedIdsLast = [
            ...products.map((p) => p.id).filter((id) => !lastPart.includes(id)),
            ...lastPart,
          ]

          await Promise.all(
            orderedIdsLast.map(async (id, idx) => {
              const product = products.find((p) => p.id === id)
              if (product?.shop_rank === idx + 1) return
              await productRepo.update({ id }, { shop_rank: idx + 1 })
            }),
          )
          break

        case SortType.NEXT:
          if (movedPage === totalPages) return

          const nextPageIds = products
            .slice(movedPage * limit, (movedPage + 1) * limit)
            .map((p) => p.id)
          const orderedIdsNext = [
            ...movedPageIds.filter((p) => !movedIds.includes(p)),
            ...nextPageIds.slice(0, movedIds.length),
            ...movedIds,
            ...nextPageIds.slice(movedIds.length),
          ]
          const minRankNext = Math.min(
            ...orderedIdsNext
              .map((id) => products.find((p) => id === p.id))
              .map((p) => p.shop_rank),
          )

          await Promise.all(
            orderedIdsNext.map(async (id, idx) => {
              await productRepo.update({ id }, { shop_rank: idx + minRankNext })
            }),
          )
          break
        case SortType.PREV:
          if (movedPage === 1) return

          const prevPageIds = products
            .slice((movedPage - 2) * limit, (movedPage - 1) * limit)
            .map((p) => p.id)
          const minRankPrev = products.find(
            (p) => p.id === prevPageIds[0],
          ).shop_rank

          const orderedIdsPrev = [
            ...movedIds,
            ...prevPageIds,
            ...movedPageIds.filter((id) => !movedIds.includes(id)),
          ]

          await Promise.all(
            orderedIdsPrev.map(async (id, idx) => {
              await productRepo.update({ id }, { shop_rank: idx + minRankPrev })
            }),
          )
          break
        default:
          break
      }
    })
  }

  async reIndexRankByStatus(storeId: string, status: ProductStatus) {
    return this.atomicPhase_(async (tx) => {
      const productRepo = tx.getCustomRepository(this.productRepo_)

      const products = await productRepo.find({
        where: { store_id: storeId, status },
        select: ['id'],
        order: { shop_rank: 'ASC' },
      })

      await Promise.all(
        products.map(async (p, idx) => {
          await productRepo.update({ id: p.id }, { shop_rank: idx + 1 })
        }),
      )
    })
  }

  async addBulkRanksByStatus(
    storeId: string,
    status: ProductStatus,
    ids: string[],
  ) {
    return this.atomicPhase_(async (tx) => {
      const productRepo = tx.getCustomRepository(this.productRepo_)
      const qb = productRepo.createQueryBuilder('product')

      let cnt = 0

      // const query = productRepo
      //   .createQueryBuilder('product')
      //   .update(Product)
      //   .set({
      //     shop_rank: () => `product.shop_rank + ${ids.length}`,
      //   })
      //   .where({ store_id: storeId, status, id: Not(In(ids)) })
      //   .getQuery()

      // this.logger_.debug(query)

      await qb
        .update(Product)
        .set({
          shop_rank: () => `product.shop_rank + ${ids.length}`,
        })
        .where({ store_id: storeId, status, id: Not(In(ids)) })

        .execute()
      await Promise.all(
        ids.map(async (id) => {
          await productRepo.update({ id }, { shop_rank: ++cnt })
        }),
      )
    })
  }

  async resetRank(type: string, storeIds: string[] = []) {
    return this.atomicPhase_(async (tx) => {
      const productRepo = tx.getCustomRepository(this.productRepo_)
      const storeRepo = tx.getCustomRepository(this.storeRepo_)

      if (type === 'all') {
        await productRepo
          .createQueryBuilder()
          .update(Product)
          .set({ shop_rank: 0 })
          .execute()
        await productRepo
          .createQueryBuilder()
          .update(Store)
          .set({ init_rank: false })
          .execute()
        return
      }

      if (type === 'store') {
        await productRepo
          .createQueryBuilder()
          .update(Store)
          .set({ init_rank: false })
          .where({ id: In(storeIds) })
          .execute()
        await storeRepo
          .createQueryBuilder()
          .update(Product)
          .set({ shop_rank: 0 })
          .where({ store_id: In(storeIds) })
          .execute()

        return
      }
    })
  }

  async checkRankStore(ids: string[]) {
    const productRepo = this.manager_.getCustomRepository(this.productRepo_)

    const products = await productRepo.find({
      where: { id: In(ids) },
      select: ['id', 'shop_rank', 'store_id', 'status'],
    })

    if (!products.length) return

    const ranks = products.map((p) => p.shop_rank as number)

    const uniqueRanks = new Set(ranks)

    if (uniqueRanks.size !== ranks.length || !checkConsecutive(ranks)) {
      await this.reIndexRankByStatus(products[0].store_id, products[0].status)
    }
  }
}
