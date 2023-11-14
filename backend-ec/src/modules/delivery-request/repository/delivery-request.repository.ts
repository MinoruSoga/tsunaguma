import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { DeliveryRequest } from '../entities/delivery-request.entity'

@MedusaRepository()
@EntityRepository(DeliveryRequest)
export class DeliveryRequestRepository extends Repository<DeliveryRequest> {}
