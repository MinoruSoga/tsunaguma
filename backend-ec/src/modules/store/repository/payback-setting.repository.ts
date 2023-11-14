import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { PaybackSetting } from '../entity/payback-setting.entity'

@MedusaRepository()
@EntityRepository(PaybackSetting)
export class PaybackSettingRepository extends Repository<PaybackSetting> {}
