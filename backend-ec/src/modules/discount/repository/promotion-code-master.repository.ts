import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { PromotionCodeMaster } from '../entities/promotion-code-master.entity'

@MedusaRepository()
@EntityRepository(PromotionCodeMaster)
export class PromotionCodeMasterRepository extends Repository<PromotionCodeMaster> {}
