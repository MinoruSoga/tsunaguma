import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

import { UserStatus, UserType } from '../entity/user.entity'

@Migration()
export class UserMigration1666953228393 implements MigrationInterface {
  name = 'UserMigration1666953228393'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_type_enum" AS ENUM(${Object.values(UserType)
        .map((val) => `'${val}'`)
        .join(',')})`,
    )
    await queryRunner.query(
      `CREATE TYPE "user_status_enum" AS ENUM(${Object.values(UserStatus)
        .map((val) => `'${val}'`)
        .join(',')})`,
    )
    await queryRunner.addColumns('user', [
      new TableColumn({
        name: 'nickname',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: Object.values(UserType),
      }),
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: Object.values(UserStatus),
      }),
      new TableColumn({
        name: 'avatar',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'store_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'role_id',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKeys('user', [
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'role',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('user', [
      'nickname',
      'type',
      'status',
      'avatar',
      'store_id',
      'role_id',
    ])
    await queryRunner.query('DROP TYPE "user_type_enum"')
    await queryRunner.query('DROP TYPE "user_status_enum"')
  }
}
