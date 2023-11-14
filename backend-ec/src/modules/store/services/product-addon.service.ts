import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import { EditProductAddonReq } from '../controllers/product-addons/edit-product-addon.admin.controller'
import { ProductAddon } from '../entity/product-addon.entity'
import { ProductAddonRepository } from '../repository/product-addon.repository'
import { LineItemAddonsRepository } from './../../cart/repository/line-item-addons.repository'

type InjectedDependencies = {
  manager: EntityManager
  productAddonRepository: typeof ProductAddonRepository
  lineItemAddonsRepository: typeof LineItemAddonsRepository
}

export type UpdateProductAddonInput = {
  name?: string
  price?: number
}

@Service()
export class ProductAddonService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'productAddonService'
  protected container_: InjectedDependencies
  protected readonly productAddonRepository_: typeof ProductAddonRepository
  protected readonly lineItemAddonsRepository: typeof LineItemAddonsRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.transactionManager_ = container.manager
    this.container_ = container
    this.productAddonRepository_ = container.productAddonRepository
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ProductAddonService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ProductAddonService({
      ...this.container_,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async save(
    data: DeepPartial<ProductAddon>,
    manager?: EntityManager,
  ): Promise<ProductAddon> {
    const service = manager ? this.withTransaction(manager) : this
    const productAddonRepo = service.manager_.getCustomRepository(
      this.productAddonRepository_,
    )
    const createdData = productAddonRepo.create(data)
    const savedData = await productAddonRepo.save(createdData)

    return savedData
  }

  async list(storeId: string) {
    const productAddonRepo = this.manager_.getCustomRepository(
      this.productAddonRepository_,
    )
    const qb = productAddonRepo.createQueryBuilder('prod_addon')

    qb.leftJoin('prod_addon.children', 'prod_addon_child')
    qb.select(['prod_addon.id', 'prod_addon.name', 'prod_addon.created_at'])
    qb.addSelect([
      'prod_addon_child.id',
      'prod_addon_child.name',
      'prod_addon_child.price',
      'prod_addon_child.rank',
    ])
    qb.where('prod_addon.parent_id IS NULL')
    qb.andWhere('prod_addon.store_id = :storeId', {
      storeId: storeId,
    })
    qb.orderBy('prod_addon.created_at', 'DESC')

    return await qb.getMany()
  }

  async listByStore(storeId: string) {
    const productAddonRepo = this.manager_.getCustomRepository(
      this.productAddonRepository_,
    )
    const qb = productAddonRepo.createQueryBuilder('prod_addon')

    qb.leftJoin('prod_addon.children', 'prod_addon_child')
    qb.select(['prod_addon.id', 'prod_addon.name'])
    qb.addSelect([
      'prod_addon_child.id',
      'prod_addon_child.name',
      'prod_addon_child.price',
    ])
    qb.where('prod_addon.parent_id IS NULL')
    qb.andWhere('prod_addon.store_id = :storeId', {
      storeId: storeId,
    })

    return await qb.getMany()
  }

  async retrieve(
    storeId: string,
    productAddonId: string,
    config: FindConfig<ProductAddon> = {},
  ): Promise<ProductAddon | never> {
    const productAddonRepo = this.manager_.getCustomRepository(
      this.productAddonRepository_,
    )

    const query = buildQuery<
      Pick<ProductAddon, 'id' | 'store_id'>,
      ProductAddon
    >({ id: productAddonId, store_id: storeId }, config)
    const productAddon = await productAddonRepo.findOne(query)

    if (!productAddon) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product addon with ${productAddonId} was not found`,
      )
    }

    return productAddon
  }

  async update(
    storeId: string,
    productAddonId: string,
    data: EditProductAddonReq,
  ): Promise<ProductAddon> {
    return await this.atomicPhase_(async (manager) => {
      const productAddonRepo = manager.getCustomRepository(
        this.productAddonRepository_,
      )
      await this.retrieve(storeId, productAddonId)

      const { children, ...rest } = data
      const createdProductAddon = productAddonRepo.create({
        id: productAddonId,
        ...rest,
      })

      if (children) {
        const deletedAddons = children.filter((a) => a.isDeleted)
        const upsertAddons = children.filter((a) => !a.isDeleted)
        await Promise.all(
          deletedAddons.map(async (item) => {
            // delete product addon
            return await productAddonRepo.delete({ id: item.id })
          }),
        )

        await Promise.all(
          upsertAddons.map(async (item, index) => {
            if (item.id) {
              // update product addon
              return await this.save(
                productAddonRepo.create({ ...item, rank: index + 1 }),
                manager,
              )
            } else {
              // create new product addon
              return await this.save(
                {
                  ...item,
                  store_id: storeId,
                  parent_id: productAddonId,
                  rank: index + 1,
                },
                manager,
              )
            }
          }),
        )
      }

      const result = await productAddonRepo.save(createdProductAddon)
      return result
    })
  }

  async delete(productAddonId: string): Promise<void> {
    const productAddonRepo = this.manager_.getCustomRepository(
      this.productAddonRepository_,
    )

    // check if a line item is using this addon => can not delete (temporary, need to change later)
    const lineItemAddonRepo = this.manager_.getCustomRepository(
      this.container_.lineItemAddonsRepository,
    )

    const addon = await lineItemAddonRepo.findOne({
      where: { lv1_id: productAddonId },
      select: ['lv1_id'],
    })
    if (addon)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Can not delete addon with id ${productAddonId}`,
      )

    await productAddonRepo.delete({ id: productAddonId })
  }

  async validateByStore(
    data: (string | ProductAddon)[],
    storeId: string,
  ): Promise<void> {
    const productAddonRepo = this.manager_.getCustomRepository(
      this.productAddonRepository_,
    )

    const ids = data.map((item) => (typeof item === 'string' ? item : item.id))

    for (const id of ids) {
      const so = await productAddonRepo.findOne({ id, store_id: storeId })
      if (!so)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          'Product addon not found',
        )
    }
  }
}
