import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ReturnDelivery } from '../entities/return-delivery.entity'

@MedusaRepository()
@EntityRepository(ReturnDelivery)
export class ReturnDeliveryRepository extends Repository<ReturnDelivery> {}
