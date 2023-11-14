import { CustomerRepository as MedusaCustomerRepository } from '@medusajs/medusa/dist/repositories/customer'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { EntityRepository } from 'typeorm'

import { Customer } from '../entity/customer.entity'

@MedusaRepository({ override: MedusaCustomerRepository })
@EntityRepository(Customer)
export class CustomerRepository extends Utils.repositoryMixin<
  Customer,
  MedusaCustomerRepository
>(MedusaCustomerRepository) {}
