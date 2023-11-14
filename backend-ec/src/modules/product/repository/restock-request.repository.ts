import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { RestockRequest } from '../entity/restock-request.entity'

@MedusaRepository()
@EntityRepository(RestockRequest)
export class RestockRequestRepository extends Repository<RestockRequest> {}
