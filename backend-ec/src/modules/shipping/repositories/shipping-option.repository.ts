import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ShippingOption } from '../entities/shipping-option.entity'

@MedusaRepository()
@EntityRepository(ShippingOption)
export class ShippingOptionRepository extends Repository<ShippingOption> {}
