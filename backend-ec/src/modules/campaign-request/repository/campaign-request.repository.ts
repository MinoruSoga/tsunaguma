import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { CampaignRequest } from '../entities/campaign-request.entity'

@MedusaRepository()
@EntityRepository(CampaignRequest)
export class CampaignRequestRepository extends Repository<CampaignRequest> {}
