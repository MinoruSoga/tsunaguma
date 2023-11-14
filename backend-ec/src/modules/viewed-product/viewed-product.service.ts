/* eslint-disable @typescript-eslint/ban-ts-comment */
import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { Service } from 'medusa-extender'
import { EntityManager, In, IsNull } from 'typeorm'

import { allowedProductFavoriteStatuses } from '../product/constant'
import { User } from '../user/entity/user.entity'
import { SyncViewedProductReq } from './controllers/sync-viewed-product.store.controller'
import { UpdateViewedProductReq } from './controllers/update-viewed-product.store.controller'
import { ViewedProduct } from './entity/viewed-product.entity'
import { ViewedProductRepository } from './respository/viewed-product.repository'

type InjectedDependencies = {
  manager: EntityManager
  viewedProductRepository: typeof ViewedProductRepository
  loggedInUser?: User
}
@Service()
export class ViewedProductService extends TransactionBaseService {
  static resolutionKey = 'viewedProductService'

  protected readonly manager_: EntityManager
  protected transactionManager_: EntityManager
  protected readonly viewedProductRepository_: typeof ViewedProductRepository

  constructor(private readonly container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.viewedProductRepository_ = container.viewedProductRepository
  }

  public async getListViewedProducts(
    selector: Selector<ViewedProduct>,
    config: FindConfig<ViewedProduct>,
    userId: string | null,
  ) {
    const viewedProductRepo = this.manager_.getCustomRepository(
      this.viewedProductRepository_,
    )

    const query = buildQuery(selector, {
      ...config,
      order: { created_at: 'DESC' },
      relations: ['product'],
    })

    if (userId) {
      query.where = [
        {
          user_id: userId,
          product: {
            status: In(allowedProductFavoriteStatuses),
          },
        },
      ]
    } else {
      query.where = [
        {
          tmp_user_id: selector.tmp_user_id,
          product: {
            status: In(allowedProductFavoriteStatuses),
          },
        },
      ]
    }

    return await viewedProductRepo.findAndCount(query)
  }

  public async updateViewedProducts(
    data: UpdateViewedProductReq,
    userId?: string,
  ): Promise<ViewedProduct> {
    const viewedProductRepo = this.manager_.getCustomRepository(
      this.viewedProductRepository_,
    )
    const product = await viewedProductRepo.find({
      where: [
        {
          user_id: userId,
          product_id: data.product_id,
        },
        { tmp_user_id: data.tmp_user_id, product_id: data.product_id },
      ],
    })

    if (userId) {
      await viewedProductRepo.delete({
        user_id: userId,
        product_id: In(product.map((prod) => prod.product_id)),
      })
    } else {
      await viewedProductRepo.delete({
        tmp_user_id: data.tmp_user_id,
        product_id: In(product.map((prod) => prod.product_id)),
      })
    }

    return await viewedProductRepo.save(
      viewedProductRepo.create({ ...data, user_id: userId }),
    )
  }

  public async syncViewedProducts(data: SyncViewedProductReq, userId: string) {
    const viewedProductRepo = this.manager_.getCustomRepository(
      this.viewedProductRepository_,
    )

    const viewedProds = await viewedProductRepo.find({
      tmp_user_id: data.tmp_user_id,
      user_id: IsNull(),
    })

    if (viewedProds?.length) {
      await viewedProductRepo.delete({
        user_id: userId,
        product_id: In(viewedProds.map((prod) => prod.product_id)),
      })
    }

    await viewedProductRepo
      .createQueryBuilder()
      .update(ViewedProduct)
      .set({ user_id: userId })
      .where({ tmp_user_id: data.tmp_user_id })
      .andWhere({ user_id: IsNull() })
      .execute()
  }
}
