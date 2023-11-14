import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ShippingProfile } from '../entities/shipping-profile.entity'

@MedusaRepository()
@EntityRepository(ShippingProfile)
export class ShippingProfileRepository extends Repository<ShippingProfile> {}
