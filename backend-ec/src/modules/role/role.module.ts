import { Module } from 'medusa-extender'

import { RoleMigration1655131148363 } from './migrations/1655131148363-role.migration'
import { Role } from './role.entity'
import { RoleRepository } from './role.repository'

@Module({
  imports: [Role, RoleRepository, RoleMigration1655131148363],
})
export class RoleModule {}
