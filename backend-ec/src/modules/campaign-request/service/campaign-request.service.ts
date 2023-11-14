import { ProductStatus, TransactionBaseService } from '@medusajs/medusa'
import { MoneyAmountRepository } from '@medusajs/medusa/dist/repositories/money-amount'
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, IsNull } from 'typeorm'

import {
  CAMPAIGN_REQUEST_END_DATE,
  CAMPAIGN_REQUEST_START_DATE,
} from '../../../helpers/constant'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../../interfaces/email-template'
import { EventBusService } from '../../event/event-bus.service'
import ProductRepository from '../../product/repository/product.repository'
import { StoreStatus } from '../../store/entity/store.entity'
import StoreRepository from '../../store/repository/store.repository'
import {
  CampaignRequest,
  CampaignRequestStatus,
  CampaignRequestType,
} from '../entities/campaign-request.entity'
import { CampaignRequestRepository } from '../repository/campaign-request.repository'

dayjs.extend(utc)

type InjectedDependencies = {
  manager: EntityManager
  campaignRequestRepository: typeof CampaignRequestRepository
  productRepository: typeof ProductRepository
  storeRepository: typeof StoreRepository
  logger: Logger
  eventBusService: EventBusService
  moneyAmountRepository: typeof MoneyAmountRepository
}

export type PostCampainRequestReq = {
  store_id: string
  product_id: string
  status: CampaignRequestStatus
  type: CampaignRequestType
  expired_at?: string | Date
  medatata?: Record<string, unknown>
}

export type PutCampainRequestReq = {
  product_id?: string
  status?: CampaignRequestStatus
  type?: CampaignRequestType
  expired_at?: string | Date
  medatata?: Record<string, unknown>
}

@Service()
export class CampaignRequestService
  extends TransactionBaseService
  implements IEmailTemplateDataService
{
  protected manager_: EntityManager
  protected transactionManager_: EntityManager

  static resolutionKey = 'campaignRequestService'
  static Events = {
    CREATE: 'campaign_request.created',
  }

  protected readonly campaignRequestRepo_: typeof CampaignRequestRepository
  protected readonly storeRepo_: typeof StoreRepository
  protected readonly productRepo_: typeof ProductRepository
  protected readonly moneyAmountRepo_: typeof MoneyAmountRepository

  private eventBus_: EventBusService
  private logger_: Logger

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.campaignRequestRepo_ = container.campaignRequestRepository
    this.logger_ = container.logger
    this.storeRepo_ = container.storeRepository
    this.productRepo_ = container.productRepository
    this.eventBus_ = container.eventBusService
    this.moneyAmountRepo_ = container.moneyAmountRepository
  }

  async create(data: PostCampainRequestReq) {
    return this.atomicPhase_(async (tx) => {
      const campaignRequestRepo = tx.getCustomRepository(
        this.campaignRequestRepo_,
      )

      const productRepo = tx.getCustomRepository(this.productRepo_)

      const check = await this.checkDataCampaignRequest(
        data.store_id,
        data.product_id,
        data.type,
      )

      if (!check) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Product or Store invalid Or Store has campaign request, please check!',
        )
      }

      const toCreate = campaignRequestRepo.create(data)

      const campaignRequest = await campaignRequestRepo.save(toCreate)

      await productRepo.update(campaignRequest.product_id, {
        spec_rate: 0,
        spec_starts_at: dayjs(CAMPAIGN_REQUEST_START_DATE)
          .startOf('day')
          .toDate(),
        spec_ends_at: dayjs(CAMPAIGN_REQUEST_END_DATE).endOf('day').toDate(),
      })

      await this.eventBus_.emit(CampaignRequestService.Events.CREATE, {
        id: campaignRequest.id,
        format: 'campaign-request-shop',
      })

      return campaignRequest
    })
  }

  async update(id: string, data: PutCampainRequestReq) {
    return this.atomicPhase_(async (tx) => {
      const campaignRequestRepo = tx.getCustomRepository(
        this.campaignRequestRepo_,
      )

      const campaignRequest = await campaignRequestRepo.findOne(id)

      if (!campaignRequest) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          'Campaign request not found!',
        )
      }

      const check = await this.checkUpdateCampaignRequest(
        id,
        campaignRequest.store_id,
        data.product_id,
        data?.type || campaignRequest.type,
      )

      if (!check) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Product or Store invalid Or Store has campaign request, please check!',
        )
      }

      const toUpdate = {
        ...campaignRequest,
        ...data,
      } as CampaignRequest

      // if (
      //   toUpdate.status === CampaignRequestStatus.APPROVE &&
      //   !campaignRequest.approved_at
      // ) {
      //   toUpdate.approved_at = dayjs().toDate()

      //   await productRepo.update(campaignRequest.product_id, {
      //     spec_rate: 0,
      //     spec_starts_at: dayjs(CAMPAIGN_REQUEST_START_DATE)
      //       .startOf('day')
      //       .toDate(),
      //     spec_ends_at: dayjs(CAMPAIGN_REQUEST_END_DATE).endOf('day').toDate(),
      //   })
      // }

      return await campaignRequestRepo.save(toUpdate)
    })
  }

  async checkDataCampaignRequest(
    storeId: string,
    productId: string,
    type: CampaignRequestType,
  ): Promise<boolean> {
    return this.atomicPhase_(async (tx) => {
      const productRepo = tx.getCustomRepository(this.productRepo_)
      const storeRepo = tx.getCustomRepository(this.storeRepo_)
      const campaignRequestRepo = tx.getCustomRepository(
        this.campaignRequestRepo_,
      )

      const store = await storeRepo.findOne({
        id: storeId,
        status: StoreStatus.APPROVED,
      })

      if (!store) {
        return false
      }

      const product = await productRepo.findOne({
        id: productId,
        status: ProductStatus.PUBLISHED,
        store_id: storeId,
      })

      if (!product) {
        return false
      }

      const campaignRequest = await campaignRequestRepo.findOne({
        store_id: storeId,
        type,
      })

      if (campaignRequest) {
        return false
      }

      return true
    })
  }

  async checkUpdateCampaignRequest(
    id: string,
    storeId: string,
    productId: string,
    type: CampaignRequestType,
  ): Promise<boolean> {
    return this.atomicPhase_(async (tx) => {
      const productRepo = tx.getCustomRepository(this.productRepo_)
      const storeRepo = tx.getCustomRepository(this.storeRepo_)
      const campaignRequestRepo = tx.getCustomRepository(
        this.campaignRequestRepo_,
      )

      const store = await storeRepo.findOne({
        id: storeId,
        status: StoreStatus.APPROVED,
      })

      if (!store) {
        return false
      }

      if (productId) {
        const product = await productRepo.findOne({
          id: productId,
          status: ProductStatus.PUBLISHED,
          store_id: storeId,
        })

        if (!product) {
          return false
        }
      }

      const raw = await campaignRequestRepo.findOne(id)

      const campaignRequest = await campaignRequestRepo.findOne({
        store_id: storeId,
        type,
      })

      if (campaignRequest && type !== raw.type) {
        return false
      }

      return true
    })
  }

  async retrieve(id: string): Promise<CampaignRequest> {
    return this.atomicPhase_(async (tx) => {
      const campaignRequestRepo = tx.getCustomRepository(
        this.campaignRequestRepo_,
      )

      return await campaignRequestRepo.findOne(id)
    })
  }

  async list(
    selector: Selector<CampaignRequest>,
    config: FindConfig<CampaignRequest>,
  ) {
    return this.atomicPhase_(async (tx) => {
      const campaignRequestRepo = tx.getCustomRepository(
        this.campaignRequestRepo_,
      )

      const query = buildQuery(selector, config)

      return await campaignRequestRepo.find(query)
    })
  }

  async retrieveByStore(id: string): Promise<CampaignRequest[]> {
    return this.atomicPhase_(async (tx) => {
      const campaignRequestRepo = tx.getCustomRepository(
        this.campaignRequestRepo_,
      )

      return await campaignRequestRepo.find({
        store_id: id,
      })
    })
  }

  async delete(id: string) {
    return this.atomicPhase_(async (tx) => {
      const campaignRequestRepo = tx.getCustomRepository(
        this.campaignRequestRepo_,
      )

      return await campaignRequestRepo.delete(id)
    })
  }

  async decorateByStore(id: string) {
    return this.atomicPhase_(async (tx) => {
      const storeRepo = tx.getCustomRepository(this.storeRepo_)

      const store = await storeRepo.findOne(id)

      return store.created_at
    })
  }

  async genEmailData(
    event: string,
    data: CampaignNotificationData,
  ): Promise<EmailTemplateData> {
    try {
      const campaignRequestRepo = this.manager_.getCustomRepository(
        this.campaignRequestRepo_,
      )

      const moneyAmountRepo = this.manager_.getCustomRepository(
        this.moneyAmountRepo_,
      )

      const campaignRequest = await campaignRequestRepo.findOne(data.id, {
        relations: ['store', 'product', 'store.owner', 'product.variants'],
      })

      const variant = campaignRequest.product.variants.find(
        (e) => e.is_deleted === false,
      )

      const price = await moneyAmountRepo.findOne({
        variant_id: variant.id,
        price_list_id: IsNull(),
      })

      return {
        to: campaignRequest.store.owner.email,
        format: data.format,
        data: { campaignRequest, price: price.amount },
      }
    } catch (error) {
      this.logger_.error(error)
    }
  }
}

interface CampaignNotificationData {
  id: string
  format: string
}
