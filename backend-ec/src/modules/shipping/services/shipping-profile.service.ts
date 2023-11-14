import { ShippingProfileType, TransactionBaseService } from '@medusajs/medusa'
import { ShippingProfileService as MedusaShippingProfileService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager, FindOneOptions } from 'typeorm'

import StoreService from '../../store/services/store.service'
import { ShippingProfile } from '../entities/shipping-profile.entity'
import { ShippingProfileRepository } from '../repositories/shipping-profile.repository'
import { LoggedInUser } from './../../../interfaces/loggedin-user'

type InjectedDependencies = {
  manager: EntityManager
  shippingProfileRepository: typeof ShippingProfileRepository
  storeService: StoreService
  logger: Logger
  loggedInUser: LoggedInUser
}

type CreateShippingProfileInput = {
  name: string
  type?: ShippingProfileType
  store_id?: string
}

@Service({ override: MedusaShippingProfileService, scope: 'SCOPED' })
export class ShippingProfileService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'shippingProfileService'
  protected container_: InjectedDependencies
  protected storeService: StoreService
  protected logger_: Logger

  protected shippingProfileRepository_: typeof ShippingProfileRepository

  constructor(container: InjectedDependencies) {
    super(container)

    this.storeService = container.storeService
    this.shippingProfileRepository_ = container.shippingProfileRepository
    this.manager_ = container.manager
    this.container_ = container
    this.logger_ = container.logger
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): ShippingProfileService {
    if (!transactionManager) {
      return this
    }

    const cloned = new ShippingProfileService({
      ...this.container_,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  /**
   * Creates a shipping profile with provided data given that the data is validated.
   * @param shippingProfile - the shippingProfile data to create
   * @return the result of the create operation
   */
  async create(
    shippingProfile: CreateShippingProfileInput,
  ): Promise<ShippingProfile> {
    return await this.atomicPhase_(async (manager) => {
      const shippingProfileRepo = manager.getCustomRepository(
        this.shippingProfileRepository_,
      )

      const created = shippingProfileRepo.create(shippingProfile)
      const result = await shippingProfileRepo.save(created)

      return result
    })
  }

  async findOne(
    options: FindOneOptions<ShippingProfile> = {},
  ): Promise<ShippingProfile | never> {
    const shippingProfileRepo = this.manager_.getCustomRepository(
      this.shippingProfileRepository_,
    )

    const profile = await shippingProfileRepo.findOne(options)

    if (!profile)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Shipping profile not found`,
      )

    return profile
  }

  async retrieveDefault(
    storeId?: string,
  ): Promise<ShippingProfile | undefined> {
    const profileRepository = this.manager_.getCustomRepository(
      this.shippingProfileRepository_,
    )
    const qStore = storeId || this.container_.loggedInUser?.store_id
    const defaultProfile = { type: 'default' }
    const where = qStore
      ? { ...defaultProfile, store_id: qStore }
      : defaultProfile

    let profile = await profileRepository.findOne({
      where: where,
    })
    if (!profile && qStore) {
      profile = await this.create({
        name: 'Default profile',
        store_id: qStore,
        type: ShippingProfileType.DEFAULT,
      })
    }

    if (!profile) {
      profile = await profileRepository.findOne({
        where: defaultProfile,
      })
    }

    return profile
  }

  createDefault() {
    this.logger_.info('Create default shipping profile not implemented')
  }
  createGiftCardDefault() {
    this.logger_.info(
      'Create gift card default shipping profile not implemented',
    )
  }
}
