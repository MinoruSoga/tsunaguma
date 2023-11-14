import { ShippingProfileType } from '@medusajs/medusa'
import { AddressRepository } from '@medusajs/medusa/dist/repositories/address'
import { EventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { EntityManager } from 'typeorm'

import { ShippingProfileService } from '../modules/shipping/services/shipping-profile.service'
import { StoreStatus } from '../modules/store/entity/store.entity'
import StoreRepository from '../modules/store/repository/store.repository'
import StoreService from '../modules/store/services/store.service'
import UserRepository from '../modules/user/user.repository'
import PusherService from '../services/pusher.service'
import { Order } from './../modules/order/entity/order.entity'
import { OrderService } from './../modules/order/services/order.service'
import { SeqService } from './../modules/seq/seq.service'
import { StoreDetail } from './../modules/store/entity/store-detail.entity'
import { StoreDetailService } from './../modules/store/services/store-detail.service'
import { Address } from './../modules/user/entity/address.entity'
import UserService from './../modules/user/services/user.service'

type InjectionDependencies = {
  shippingProfileService: ShippingProfileService
  eventBusService: EventBusService
  logger: Logger
  storeDetailService: StoreDetailService
  userService: UserService
  addressRepository: typeof AddressRepository
  manager: EntityManager
  storeService: StoreService
  seqService: SeqService
  userRepository: typeof UserRepository
  storeRepository: typeof StoreRepository
  pusherService: PusherService
}

function convertFromStoreDetailToAddress(
  storeDetail: StoreDetail,
): Partial<Address> {
  return {
    address_1: storeDetail.addr_01,
    address_2: storeDetail.addr_02,
    // city: '',
    // company: '',
    first_name: storeDetail.firstname,
    last_name: storeDetail.lastname,
    prefecture_id: storeDetail.prefecture_id,
    province: storeDetail.prefecture_id,
    phone: storeDetail.tel_number,
    postal_code: storeDetail.post_code,
  }
}

function convertFromAddressToStoreDetail(
  address: Address,
): Partial<StoreDetail> {
  return {
    addr_01: address.address_1,
    addr_02: address.address_2,
    firstname: address.first_name,
    lastname: address.last_name,
    prefecture_id: address.prefecture_id || address.province,
    tel_number: address.phone,
    post_code: address.postal_code,
  }
}

class StoreSubscriber {
  private logger_: Logger
  private shippingProfileService_: ShippingProfileService
  private storeDetailService_: StoreDetailService
  private userService_: UserService
  private storeService_: StoreService
  private seqService_: SeqService
  private addressRepo_: typeof AddressRepository
  private manager: EntityManager
  private userRepo_: typeof UserRepository
  private storeRepo_: typeof StoreRepository
  private pusherService_: PusherService

  constructor({
    eventBusService,
    logger,
    shippingProfileService,
    storeDetailService,
    userService,
    addressRepository,
    manager,
    storeService,
    userRepository,
    seqService,
    storeRepository,
  }: InjectionDependencies) {
    this.logger_ = logger
    this.manager = manager
    this.shippingProfileService_ = shippingProfileService
    this.storeDetailService_ = storeDetailService
    this.userService_ = userService
    this.addressRepo_ = addressRepository
    this.storeService_ = storeService
    this.userRepo_ = userRepository
    this.seqService_ = seqService
    this.storeRepo_ = storeRepository
    this.pusherService_ = new PusherService()

    // subscribe events
    eventBusService.subscribe(
      StoreService.Events.CREATED,
      this.handleStoreCreated.bind(this),
    )

    // when store detail information updated, we sync address with store detail
    eventBusService.subscribe(
      StoreDetailService.Events.UPDATED,
      this.handleStoreDetailUpdated.bind(this),
    )

    // when address change, we sync address with store detail
    eventBusService.subscribe(
      UserService.Events.UPDATE_ADDRESS,
      this.handleAddressUpdate.bind(this),
    )

    // when store receive new order
    eventBusService.subscribe(
      OrderService.Events.SETTLED,
      this.handleNewOrderStore.bind(this),
    )
  }

  handleStoreCreated = async (data: { id: string }) => {
    // create shipping profile here
    this.logger_.debug(`Store with id ${data.id} created successfully!`)

    const profile = await this.shippingProfileService_.retrieveDefault(data.id)
    if (profile) return

    // add a default shipping profile to the store when it is created
    await this.shippingProfileService_.create({
      name: 'Default profile',
      store_id: data.id,
      type: ShippingProfileType.DEFAULT,
    })
  }

  async handleStoreDetailUpdated({ id }: { id: string }) {
    try {
      const addressRepo = this.manager.getCustomRepository(this.addressRepo_)
      const userRepo = this.manager.getCustomRepository(this.userRepo_)
      const storeDetail = await this.storeDetailService_.retrieve(id)

      // check if store detail owner has a main address or not
      const user = await this.userService_.retrieve(storeDetail.user_id, {
        relations: ['address'],
      })

      const toUpdate = convertFromStoreDetailToAddress(storeDetail)
      if (user.address) {
        // this user already have an address
        await addressRepo.update(user.address.id, toUpdate)
      } else {
        // this user does not have an address
        user.address = (await addressRepo.save(
          addressRepo.create(toUpdate),
        )) as Address
        await userRepo.save(user)
      }
    } catch (error) {
      this.logger_.error(error)
    }
  }

  async handleAddressUpdate({
    userId,
    addressId,
  }: {
    userId: string
    addressId: string
  }) {
    try {
      if (!addressId) return
      const addressRepo = this.manager.getCustomRepository(this.addressRepo_)
      const storeDetail = await this.storeDetailService_.retrieveByUser(
        userId,
        false,
      )

      const address = await addressRepo.findOne(addressId)
      const toSave = convertFromAddressToStoreDetail(address as Address)

      if (storeDetail) {
        // if this user currently has address, update store detail
        await this.storeDetailService_.create(
          Object.assign(storeDetail, toSave),
        )
      } else {
        await this.storeDetailService_.create({ ...toSave, user_id: userId })
      }
    } catch (error) {
      this.logger_.error(error)
    }
  }

  async handleNewOrderStore({ data: { order } }: { data: { order: Order } }) {
    try {
      const storeRepo = this.manager.getCustomRepository(this.storeRepo_)
      await Promise.all(
        order?.children?.map(async (child) => {
          if (
            !child.store.owner_id ||
            child.store.status !== StoreStatus.APPROVED
          )
            return

          // get seq from redis
          const nextSeq = await this.seqService_.getStoreNewTransactionCnt(
            child.store.id,
          )

          // update new transaction count of that store
          await storeRepo.save({
            id: child.store.id,
            new_transaction_cnt: nextSeq,
          })

          // trigger pusher to that store owner
          await this.pusherService_.pushTrigger_(
            child.store.owner_id,
            OrderService.Events.SETTLED,
            { id: child.id },
          )
        }),
      )
    } catch (error) {
      this.logger_.error(error)
    }
  }
}

export default StoreSubscriber
