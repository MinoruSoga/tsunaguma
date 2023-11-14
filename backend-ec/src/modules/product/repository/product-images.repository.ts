import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductImages } from '../entity/product-images.entity'

@MedusaRepository()
@EntityRepository(ProductImages)
export class ProductImagesRepository extends Repository<ProductImages> {}
