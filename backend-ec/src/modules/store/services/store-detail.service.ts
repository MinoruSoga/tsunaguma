import { TransactionBaseService } from '@medusajs/medusa'
import { EventBusService } from '@medusajs/medusa/dist/services'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { isDefined, MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import { PrefectureService } from '../../prefecture/services/prefecture.service'
import { UpdateStoreCustomerInfoReq } from '../controllers/profile/update-customer-info.admin.controller'
import { Store } from '../entity/store.entity'
import { StoreDetail } from '../entity/store-detail.entity'
import StoreRepository from '../repository/store.repository'
import { StoreDetailRepository } from '../repository/store-detail.repository'

type InjectedDependencies = {
  manager: EntityManager
  storeDetailRepository: typeof StoreDetailRepository
  storeRepository: typeof StoreRepository
  prefectureService: PrefectureService
  eventBusService: EventBusService
}

@Service()
export class StoreDetailService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected container_: InjectedDependencies
  static resolutionKey = 'storeDetailService'
  protected eventBusService: EventBusService

  static Events = {
    UPDATED: 'store_detail.updated',
  }

  protected prefectureService: PrefectureService

  protected readonly storeDetailRepository_: typeof StoreDetailRepository
  protected readonly storeRepository_: typeof StoreRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.eventBusService = container.eventBusService
    this.container_ = container
    this.manager_ = container.manager
    this.prefectureService = container.prefectureService
    this.storeDetailRepository_ = container.storeDetailRepository
    this.storeRepository_ = container.storeRepository
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): StoreDetailService {
    if (!transactionManager) {
      return this
    }

    const cloned = new StoreDetailService({
      ...this.container_,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async retrieve(
    storeDetailId: string,
    config: FindConfig<StoreDetail> = {},
  ): Promise<StoreDetail | never> {
    const storeDetailRepo = this.manager_.getCustomRepository(
      this.storeDetailRepository_,
    )

    const query = buildQuery({ id: storeDetailId }, config)

    const storeDetail = await storeDetailRepo.findOne(query)

    if (!storeDetail) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store with ${storeDetailId} was not found`,
      )
    }

    return storeDetail
  }

  async retrieveByUser(userId: string, throwIfNotExist = true) {
    const storeDetailRepo = this.manager_.getCustomRepository(
      this.storeDetailRepository_,
    )

    const query = buildQuery<{ user_id: string }, StoreDetail>({
      user_id: userId,
    })
    const storeDetail = await storeDetailRepo.findOne(query)

    if (!storeDetail && throwIfNotExist) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store detail with user id ${userId} was not found`,
      )
    }

    return storeDetail
  }

  async retrieveByStore(storeId: string, throwIfNotExist = true) {
    const storeDetailRepo = this.manager_.getCustomRepository(
      this.storeDetailRepository_,
    )

    const query = buildQuery<{ id: string }, StoreDetail>({
      id: storeId,
    })
    const storeDetail = await storeDetailRepo.findOne(query)

    if (!storeDetail && throwIfNotExist) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Store detail with user id ${storeId} was not found`,
      )
    }

    return storeDetail
  }

  async create(data: DeepPartial<StoreDetail>) {
    const storeDetailRepository = this.manager_.getCustomRepository(
      this.storeDetailRepository_,
    )
    const createdData = storeDetailRepository.create(data)
    return await storeDetailRepository.save(createdData)
  }

  async update(
    userId: string,
    data: UpdateStoreCustomerInfoReq,
  ): Promise<StoreDetail> {
    return this.atomicPhase_(async (transactionManager) => {
      const storeDetail = await this.withTransaction(
        transactionManager,
      ).retrieveByUser(userId, false)

      const storeDetailRepository = transactionManager.getCustomRepository(
        this.storeDetailRepository_,
      )

      const storeRepository = transactionManager.getCustomRepository(
        this.storeRepository_,
      )
      let store: Store
      if (storeDetail) {
        store = await storeRepository.findOne(storeDetail.id)
      }

      if (data.prefecture_id) {
        await this.prefectureService.retrieve(data.prefecture_id)
      }

      let toSave: Partial<StoreDetail> = data as Partial<StoreDetail>
      toSave.user_id = userId

      let toSaveStore: Partial<Store> = data as Partial<Store>
      toSaveStore.owner_id = userId

      if (storeDetail) {
        toSave = Object.assign(storeDetail, data)
      }

      if (store && isDefined(data.business_form)) {
        toSaveStore = Object.assign(store, {
          business_form: data.business_form,
        })
        await storeRepository.save(storeRepository.create(toSaveStore))
      }

      const res = await storeDetailRepository.save(
        storeDetailRepository.create(toSave),
      )

      await this.eventBusService
        .withTransaction(transactionManager)
        .emit(StoreDetailService.Events.UPDATED, { id: res.id })

      return res
    })
  }

  async update_(
    userId: string,
    storeId: string,
    data: UpdateStoreCustomerInfoReq,
  ): Promise<StoreDetail> {
    return this.atomicPhase_(async (transactionManager) => {
      const storeDetail = await this.withTransaction(
        transactionManager,
      ).retrieveByStore(storeId, false)

      const storeDetailRepository = transactionManager.getCustomRepository(
        this.storeDetailRepository_,
      )

      if (data.prefecture_id) {
        await this.prefectureService.retrieve(data.prefecture_id)
      }

      let toSave: Partial<StoreDetail> = data as Partial<StoreDetail>
      toSave.user_id = userId

      if (storeDetail) {
        toSave = Object.assign(storeDetail, data)
      }

      const res = await storeDetailRepository.save(
        storeDetailRepository.create(toSave),
      )

      await this.eventBusService
        .withTransaction(transactionManager)
        .emit(StoreDetailService.Events.UPDATED, { id: res.id })

      return res
    })
  }

  async updateCms(
    userId: string,
    data: UpdateStoreCustomerInfoReq,
  ): Promise<StoreDetail> {
    return this.atomicPhase_(async (transactionManager) => {
      let storeDetail = await this.withTransaction(
        transactionManager,
      ).retrieveByUser(userId, false)

      if (!storeDetail) {
        storeDetail = await this.withTransaction(transactionManager).create({
          ...data,
          user_id: userId,
        })
      }

      const storeDetailRepository = transactionManager.getCustomRepository(
        this.storeDetailRepository_,
      )

      if (data.prefecture_id) {
        await this.prefectureService.retrieve(data.prefecture_id)
      }

      let toSave: Partial<StoreDetail> = data as Partial<StoreDetail>
      toSave.user_id = userId

      if (storeDetail) {
        toSave = Object.assign(storeDetail, data)
      }

      const res = await storeDetailRepository.save(
        storeDetailRepository.create(toSave),
      )

      await this.eventBusService
        .withTransaction(transactionManager)
        .emit(StoreDetailService.Events.UPDATED, { id: res.id })

      return res
    })
  }
}
