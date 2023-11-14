import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ResourceTracking } from '../entity/resource-tracking.entity'

@MedusaRepository()
@EntityRepository(ResourceTracking)
export class ResourceTrackingRepository extends Repository<ResourceTracking> {}
