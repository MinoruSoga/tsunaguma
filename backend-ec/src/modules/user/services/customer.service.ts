import {
  Address,
  CustomerGroup,
  StorePostCustomersCustomerAddressesAddressReq,
} from '@medusajs/medusa'
import { CustomerRepository } from '@medusajs/medusa/dist/repositories/customer'
import { CustomerService as MedusaCustomerService } from '@medusajs/medusa/dist/services'
import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import {
  AddressPayload,
  FindConfig,
  Selector,
} from '@medusajs/medusa/dist/types/common'
import { ConfigModule, Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery, setMetadata } from '@medusajs/medusa/dist/utils'
import { isDefined, MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import Scrypt from 'scrypt-kdf'
import { EntityManager } from 'typeorm'

import loadConfig from '../../../helpers/config'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../../../interfaces/email-template'
import { Customer } from '../entity/customer.entity'
import { User } from '../entity/user.entity'
import UserService from './user.service'

type ConstructorParams = {
  manager: EntityManager
  customerRepository: typeof CustomerRepository
  addressRepository: any
  eventBusService: EventBusService
  loggedInUser?: User
  configModule: ConfigModule
  userService: UserService
  logger: Logger
}

export type CreateCustomerInput = {
  email: string
  id?: string
  password?: string
  password_hash?: string
  has_account?: boolean

  first_name?: string
  last_name?: string
  phone?: string
  nickname?: string
  avatar?: string
  metadata?: Record<string, unknown>
}

export type UpdateCustomerInput = {
  password?: string
  metadata?: Record<string, unknown>
  billing_address?: AddressPayload | string
  billing_address_id?: string
  groups?: { id: string }[]

  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  nickname?: string
  avatar?: string
}

@Service({ override: MedusaCustomerService })
export default class CustomerService
  extends MedusaCustomerService
  implements IEmailTemplateDataService
{
  protected userService_: UserService
  protected manager_: EntityManager
  protected transactionManager_: EntityManager | undefined

  constructor(private readonly container: ConstructorParams) {
    super(container)
    this.container = container
    this.userService_ = container.userService
  }

  async genEmailData(
    event: string,
    data: CustomerNotificationData,
  ): Promise<EmailTemplateData> {
    const { email, format, ...rest } = data
    return {
      to: email,
      format,
      customer_id: rest.customer_id ?? null,
      data: rest,
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  withTransaction(transactionManager: EntityManager): CustomerService {
    if (!transactionManager) {
      return this
    }

    const cloned = new CustomerService({
      ...this.container,
      manager: transactionManager,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async retrieve_(
    selector: Selector<Customer>,
    config: FindConfig<Customer> = {},
  ): Promise<Customer | never> {
    const manager = this.transactionManager_ ?? this.manager_

    const customerRepo = manager.getCustomRepository(this.customerRepository_)

    const query = buildQuery(selector, config)
    const customer = await customerRepo.findOne(query as any)

    if (!customer) {
      const selectorConstraints = Object.entries(selector)
        .map((key, value) => `${key}: ${value}`)
        .join(', ')
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Customer with ${selectorConstraints} was not found`,
      )
    }

    return customer as Customer
  }

  async retrieveByEmail(
    email: string,
    config: FindConfig<Customer> = {},
  ): Promise<Customer | never> {
    const user = await this.userService_.retrieveByEmail(email, {
      select: ['id'],
    })
    return await this.retrieve_({ id: user.id }, config)
  }

  async updateAddressCms(
    addressId: string,
    address: StorePostCustomersCustomerAddressesAddressReq,
  ): Promise<Address> {
    return await this.atomicPhase_(async (manager) => {
      const addressRepo = manager.getCustomRepository(this.addressRepository_)

      address.country_code = address.country_code?.toLowerCase()

      const toUpdate = await addressRepo.findOne({
        where: { id: addressId },
      })

      if (!toUpdate) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Could not find address for customer',
        )
      }
      for (const [key, value] of Object.entries(address)) {
        toUpdate[key] = value
      }

      return addressRepo.save(toUpdate)
    })
  }

  async createUserCustomer(customer: CreateCustomerInput): Promise<Customer> {
    return await this.atomicPhase_(async (manager) => {
      const customerRepository = manager.getCustomRepository(
        this.customerRepository_,
      )

      customer.email = customer.email.toLowerCase()
      const { email, password } = customer

      const existing = await this.userService_
        .retrieveByEmail(email)
        .catch(() => undefined)

      if (existing && existing.has_account) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          'A customer with the given email already has an account. Log in instead',
        )
      }

      if (existing && password && !existing.has_account) {
        const hashedPassword = await this.hashPassword_(password)
        customer.password_hash = hashedPassword
        customer.has_account = true
        delete customer.password

        const toUpdate = { ...existing, ...customer }
        const updated = await customerRepository.save(toUpdate)
        await this.eventBusService_
          .withTransaction(manager)
          .emit(CustomerService.Events.UPDATED, updated)
        return updated
      } else {
        if (password) {
          const hashedPassword = await this.hashPassword_(password)
          customer.password_hash = hashedPassword
          customer.has_account = true
          delete customer.password
        }

        const created = customerRepository.create(customer)
        const result = (await customerRepository.save(created)) as Customer
        await this.eventBusService_
          .withTransaction(manager)
          .emit(CustomerService.Events.CREATED, {
            ...result,
            format: 'membership-register',
            customer_id: result.id,
            data: {
              nickname: result.nickname,
              email: result.email,
              loginLink: loadConfig().frontendUrl.login,
            },
          })
        return result
      }
    })
  }

  async update_(
    customerId: string,
    update: UpdateCustomerInput,
  ): Promise<Customer> {
    return await this.atomicPhase_(async (manager) => {
      const customerRepository = manager.getCustomRepository(
        this.customerRepository_,
      )

      const customer = await this.retrieve(customerId)

      const {
        password,
        metadata,
        billing_address,
        billing_address_id,
        groups,
        ...rest
      } = update

      if (metadata) {
        customer.metadata = setMetadata(customer, metadata)
      }

      if ('billing_address_id' in update || 'billing_address' in update) {
        const address = billing_address_id || billing_address
        if (isDefined(address)) {
          await this.updateBillingAddress_(customer, address)
        }
      }

      for (const [key, value] of Object.entries(rest)) {
        customer[key] = value
      }

      if (password) {
        customer.password_hash = await this.hashPassword_(password)
      }

      if (groups) {
        customer.groups = groups as CustomerGroup[]
      }

      const updated = await customerRepository.save(customer)

      await this.eventBusService_
        .withTransaction(manager)
        .emit(CustomerService.Events.UPDATED, updated)

      return updated as Customer
    })
  }

  async verifyPassword_(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    const buf = Buffer.from(passwordHash, 'base64')
    const isValid = await Scrypt.verify(buf, password)

    return isValid
  }

  async setPassword_(customerId: string, password: string): Promise<Customer> {
    return await this.atomicPhase_(async (manager: EntityManager) => {
      const customerRepo = manager.getCustomRepository(this.customerRepository_)

      const customer = await this.retrieve(customerId)

      const hashedPassword = await this.hashPassword_(password)
      if (!hashedPassword) {
        throw new MedusaError(
          MedusaError.Types.DB_ERROR,
          `An error occured while hashing password`,
        )
      }

      customer.password_hash = hashedPassword

      return (await customerRepo.save(customer)) as Customer
    })
  }

  async isEmailExist(email: string): Promise<boolean> {
    try {
      await this.userService_.retrieveByEmail(email, {
        select: ['id', 'email'],
      })
      return true
    } catch (error) {
      return false
    }
  }

  async removeAddress(customerId: string, addressId: string): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const addressRepo = manager.getCustomRepository(this.addressRepository_)

      // Should not fail, if user does not exist, since delete is idempotent
      const address = await addressRepo.findOne({
        where: { id: addressId, customer_id: customerId },
      })

      if (!address) {
        return
      }

      // instead of soft removing the address, just set the customer_id of the address to null
      // => order still use this address, it just not belong to any customers
      // await addressRepo.softRemove(address)
      await addressRepo.save({ ...address, customer_id: null })
    })
  }
}

interface CustomerNotificationData {
  email: string
  link?: string
  format: string
  [key: string]: any
}
