import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { FulfillmentProvider } from '../entities/fulfillment-provider.entity'

@MedusaRepository()
@EntityRepository(FulfillmentProvider)
export class FulfillmentProviderRepository extends Repository<FulfillmentProvider> {}
