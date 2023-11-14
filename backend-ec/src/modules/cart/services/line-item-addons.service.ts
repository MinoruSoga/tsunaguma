import { TransactionBaseService } from '@medusajs/medusa'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LineItemAddons } from '../entity/line-item-addons.entity'
import { LineItemAddonsRepository } from '../repository/line-item-addons.repository'
import { ProductAddonRepository } from './../../store/repository/product-addon.repository'

type InjectedDependencies = {
  manager: EntityManager
  lineItemAddonsRepository: typeof LineItemAddonsRepository
  productAddonRepository: typeof ProductAddonRepository
}

type CreateLineItemAddonInput = {
  lv1_id: string
  lv2_id: string
  line_item_id: string
  price?: number
}

type DeleteLineItemAddonInput = Omit<CreateLineItemAddonInput, 'price'>

@Service()
export class LineItemAddonsService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'lineItemAddonsService'

  protected lineItemAddonsRepository_: typeof LineItemAddonsRepository
  protected productAddonRepo_: typeof ProductAddonRepository

  constructor(container: InjectedDependencies, private readonly config: any) {
    super(container)

    this.lineItemAddonsRepository_ = container.lineItemAddonsRepository
    this.productAddonRepo_ = container.productAddonRepository
    this.manager_ = container.manager
  }

  async save(data: CreateLineItemAddonInput): Promise<LineItemAddons> {
    const productAddonRepo = this.manager_.getCustomRepository(
      this.productAddonRepo_,
    )

    const lv1 = await productAddonRepo.findOne(data.lv1_id, { select: ['id'] })
    if (!lv1)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `product addon with id ${data.lv1_id} not found`,
      )

    const lv2 = await productAddonRepo.findOne(data.lv2_id, {
      select: ['id'],
    })
    if (!lv2)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `product addon with id ${data.lv2_id} not found`,
      )

    const lineItemAddonsRepo = this.manager_.getCustomRepository(
      this.lineItemAddonsRepository_,
    )

    const lineItemAddons = lineItemAddonsRepo.create(data)

    return await lineItemAddonsRepo.save(lineItemAddons)
  }

  async delete(data: DeleteLineItemAddonInput): Promise<void> {
    const lineItemAddonsRepo = this.manager_.getCustomRepository(
      this.lineItemAddonsRepository_,
    )

    await lineItemAddonsRepo.delete(data)
  }
}
