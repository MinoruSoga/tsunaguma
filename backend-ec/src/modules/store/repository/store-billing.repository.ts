import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { StoreBilling } from '../entity/store_billing.entity'

@MedusaRepository()
@EntityRepository(StoreBilling)
export class StoreBillingRepository extends Repository<StoreBilling> {}
