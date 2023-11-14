import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { DeliveryRequestVariant } from '../entities/delivery-request-variant.entity'

@MedusaRepository()
@EntityRepository(DeliveryRequestVariant)
export class DeliveryRequestVariantRepository extends Repository<DeliveryRequestVariant> {}
