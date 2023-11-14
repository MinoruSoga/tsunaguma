import { Repository as MedusaRepository } from 'medusa-extender/dist/decorators/components.decorator'
import { EntityRepository, Repository } from 'typeorm'

import { Inquiry } from '../entities/inquiry.entity'

@MedusaRepository()
@EntityRepository(Inquiry)
export default class InquiryRepository extends Repository<Inquiry> {}
