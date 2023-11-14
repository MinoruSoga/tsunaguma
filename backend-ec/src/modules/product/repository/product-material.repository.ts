import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { ProductMaterial } from '../entity/product-material.entity'

@MedusaRepository()
@EntityRepository(ProductMaterial)
export class ProductMaterialRepository extends Repository<ProductMaterial> {}
