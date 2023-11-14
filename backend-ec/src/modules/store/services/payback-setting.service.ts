import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import UserRepository from '../../user/user.repository'
import {
  BankAccountType,
  PaybackSetting,
} from '../entity/payback-setting.entity'
import { PaybackSettingRepository } from '../repository/payback-setting.repository'
import StoreRepository from '../repository/store.repository'

type InjectedDependencies = {
  manager: EntityManager
  paybackSettingRepository: typeof PaybackSettingRepository
  userRepository: typeof UserRepository
  storeRepository: typeof StoreRepository
}

type CreatePaybackSettingInput = {
  account_name: string
  account_type: BankAccountType
  account_number: string
  branch_code: string
  branch_name: string
  bank_name: string
  bank_code?: string
  user_id: string
}

type UpdatePaybackSettingInput = {
  account_name?: string
  account_type?: BankAccountType
  account_number?: string
  branch_code?: string
  branch_name?: string
  bank_name?: string
  bank_code?: string
}

@Service()
export class PaybackSettingService extends TransactionBaseService {
  protected container: InjectedDependencies
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected paybackSettingRepo: typeof PaybackSettingRepository
  protected userRepository: typeof UserRepository
  protected storeRepository: typeof StoreRepository
  static resolutionKey = 'paybackSettingService'

  constructor(container: InjectedDependencies) {
    super(container)

    this.container = container
    this.manager_ = container.manager
    this.userRepository = container.userRepository
    this.storeRepository = container.storeRepository
    this.paybackSettingRepo = container.paybackSettingRepository
  }

  async retrieve(
    paybackId: string,
    config: FindConfig<PaybackSetting> = {},
  ): Promise<PaybackSetting | never> {
    const paybackSettingRepo = this.manager_.getCustomRepository(
      this.paybackSettingRepo,
    )

    const query = buildQuery({ id: paybackId }, config)
    const payback = await paybackSettingRepo.findOne(query)

    if (!payback) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Payback setting with ${paybackId} was not found`,
      )
    }

    return payback
  }

  async retrieveByStore(storeId: string, throwIfNotExist = true) {
    const paybackSettingRepo = this.manager_.getCustomRepository(
      this.paybackSettingRepo,
    )

    const paybackSetting = await paybackSettingRepo.findOne({
      store_id: storeId,
    })

    if (!paybackSetting && throwIfNotExist) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Payback setting not found`,
      )
    }

    return paybackSetting
  }

  async create(storeId: string, data: CreatePaybackSettingInput) {
    return this.atomicPhase_(async (tx) => {
      const paybackSettingRepo = tx.getCustomRepository(this.paybackSettingRepo)
      const storeRepo = tx.getCustomRepository(this.storeRepository)
      const userRepo = tx.getCustomRepository(this.userRepository)

      const payback = await this.retrieveByStore(storeId, false)
      if (payback)
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          `This user already has a payback setting`,
        )

      const toCreate = {
        ...data,
        store_id: storeId,
      }

      const newPayback = await paybackSettingRepo.save(
        paybackSettingRepo.create(toCreate),
      )
      await storeRepo.update(
        { id: newPayback.store_id },
        { payback_setting_id: newPayback.id },
      )
      await userRepo.update(
        { id: newPayback.user_id },
        { payback_setting_id: newPayback.id },
      )
    })
  }

  async update(
    storeId: string,
    data: UpdatePaybackSettingInput,
  ): Promise<PaybackSetting> {
    const paybackSettingRepo = this.manager_.getCustomRepository(
      this.paybackSettingRepo,
    )

    const payback = await this.retrieveByStore(storeId, true)

    return await paybackSettingRepo.save(Object.assign(payback, data))
  }
}
