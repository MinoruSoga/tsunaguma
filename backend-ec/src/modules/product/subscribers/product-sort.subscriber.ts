/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ProductStatus } from '@medusajs/medusa'
import { EventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { Subscriber } from 'medusa-extender'

import StoreService from '../../store/services/store.service'
import { Product } from '../entity/product.entity'
import ProductRepository from '../repository/product.repository'
import { ProductService } from '../services/product.service'
import { ProductSortService } from '../services/product-sort.service'

type InjectedDependencies = {
  eventBusService: EventBusService
  storeService: StoreService
  productRepository: typeof ProductRepository
  productSortService: ProductSortService
  logger: Logger
  productService: ProductService
}

const sortStatus = [ProductStatus.PROPOSED, ProductStatus.PUBLISHED]

@Subscriber()
export class ProductSortSubscriber {
  protected storeService_: StoreService
  protected productRepo_: typeof ProductRepository
  protected productSortService_: ProductSortService
  private logger_: Logger
  protected productService_: ProductService

  constructor(container: InjectedDependencies) {
    this.storeService_ = container.storeService
    this.productRepo_ = container.productRepository
    this.productSortService_ = container.productSortService
    this.logger_ = container.logger
    this.productService_ = container.productService

    // product created
    container.eventBusService.subscribe(
      ProductService.Events.CREATED,
      this.handleProductCreation.bind(this),
    )

    // product status updated
    container.eventBusService.subscribe(
      ProductService.Events.STATUS_CHANGE,
      this.handleProductStatusUpdate.bind(this),
    )

    // product deleted
    // container.eventBusService.subscribe(
    //   ProductService.Events.DELETED,
    //   this.handleProductDeletion.bind(this),
    // )

    // store deleted => reset rank
    container.eventBusService.subscribe(
      StoreService.Events.DELETED,
      this.handleStoreDeleted.bind(this),
    )
  }

  async retrieveProduct(id: string): Promise<Product> {
    const product = await this.productService_.retrieve(id, {
      // @ts-ignore
      select: ['id', 'status', 'store_id'],
    })

    return product as Product
  }

  async validateInitRank(pro: Product) {
    try {
      if (!sortStatus.includes(pro.status) || !pro.store_id) {
        return false
      }

      const isInitRank = await this.productSortService_.checkInitRank(
        pro.store_id,
      )

      if (!isInitRank) {
        await this.productSortService_.initRank(pro.store_id)
      }

      return true
    } catch (error) {
      return false
    }
  }

  async handleProductCreation({ id }: { id: string }) {
    this.logger_.info('Product sort subscriber: ===> Product created ==> ' + id)
    const pro = await this.retrieveProduct(id)

    if (!sortStatus.includes(pro.status) || !pro.store_id) {
      return
    }

    const isInitRank = await this.productSortService_.checkInitRank(
      pro.store_id,
    )

    if (!isInitRank) {
      await this.productSortService_.initRank(pro.store_id)
    } else {
      await this.productSortService_.insertNewRank(
        pro.store_id,
        pro.status,
        pro.id,
      )
    }
  }

  async handleProductStatusUpdate({
    id,
    new_status,
    old_status,
  }: {
    id: string
    old_status: ProductStatus
    new_status: ProductStatus
  }) {
    try {
      this.logger_.info(
        `Product sort subscriber: ===> Product status ${id} updated from ${old_status} to ${new_status}`,
      )
      if (old_status === new_status) return

      const pro = await this.retrieveProduct(id)

      if (!pro.store_id) {
        return
      }

      const isInitRank = await this.productSortService_.checkInitRank(
        pro.store_id,
      )

      if (!isInitRank) {
        await this.productSortService_.initRank(pro.store_id)
        return
      }

      if (sortStatus.includes(old_status)) {
        await this.productSortService_.reIndexRankByStatus(
          pro.store_id,
          old_status,
          // pro.id,
        )
      }

      if (sortStatus.includes(new_status)) {
        await this.productSortService_.addBulkRanksByStatus(
          pro.store_id,
          new_status,
          [pro.id],
        )
      }
    } catch (error) {
      this.logger_.error(error)
    }
  }

  async handleProductDeletion({ id }: { id: string }) {
    try {
      this.logger_.info(
        'Product sort subscriber: ===> Product deleted ==> ' + id,
      )
      const pro = await this.retrieveProduct(id)
      if (!sortStatus.includes(pro.status)) return

      if (!sortStatus.includes(pro.status) || !pro.store_id) {
        return
      }

      const isInitRank = await this.productSortService_.checkInitRank(
        pro.store_id,
      )

      if (!isInitRank) {
        await this.productSortService_.initRank(pro.store_id)
        return
      }

      await this.productSortService_.removeRankByStatus(
        pro.store_id,
        pro.status,
        pro.id,
      )
    } catch (error) {
      this.logger_.error(error)
    }
  }

  async handleStoreDeleted({ id }: { id: string }) {
    this.logger_.info('Product sort subscriber: ===> Store deleted ==> ' + id)
  }
}
