import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'
import { FulfillmentPrice } from '../entities/fulfillment-price.entity'


@MedusaRepository()
@EntityRepository(FulfillmentPrice)
export class FulfillmentPriceRepository extends Repository<FulfillmentPrice> { }
