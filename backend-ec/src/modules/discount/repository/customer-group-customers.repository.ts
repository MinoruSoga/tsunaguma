import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { CustomerGroupCustomers } from '../entities/customer-group-customers.entity'

@MedusaRepository()
@EntityRepository(CustomerGroupCustomers)
export class CustomerGroupCustomersRepository extends Repository<CustomerGroupCustomers> {}
