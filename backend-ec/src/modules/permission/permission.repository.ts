import { Repository as MedusaRepository } from 'medusa-extender'
import { EntityRepository, Repository } from 'typeorm'

import { Permission } from './permission.entity'

@MedusaRepository()
@EntityRepository(Permission)
export class PermissionRepository extends Repository<Permission> {}
