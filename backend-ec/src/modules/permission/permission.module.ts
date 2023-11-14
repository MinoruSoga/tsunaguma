import { Module } from 'medusa-extender'

import { PermissionMigration1655131601491 } from './migrations/1655131601491-permission.migration'
import { Permission } from './permission.entity'
import { PermissionRepository } from './permission.repository'

@Module({
  imports: [Permission, PermissionRepository, PermissionMigration1655131601491],
})
export class PermissionModule {}
