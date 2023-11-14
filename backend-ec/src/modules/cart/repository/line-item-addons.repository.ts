import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { LineItemAddons } from '../entity/line-item-addons.entity'

@MedusaRepository()
@EntityRepository(LineItemAddons)
export class LineItemAddonsRepository extends Repository<LineItemAddons> {}
