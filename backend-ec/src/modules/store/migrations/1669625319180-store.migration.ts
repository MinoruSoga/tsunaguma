import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

import { BankAccountType } from '../entity/payback-setting.entity'

@Migration()
export class StoreMigration1669625319180 implements MigrationInterface {
  name = 'StoreMigration1669625319180'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payback_setting', true)
    await queryRunner.createTable(
      new Table({
        name: 'payback_setting',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'account_type',
            type: 'enum',
            isNullable: false,
            enum: Object.values(BankAccountType),
          },
          {
            name: 'account_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'account_number',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'bank_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'bank_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'branch_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'branch_code',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            name: 'fk_payback_setting_user',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_payback_setting_store',
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    )

    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'payback_setting_id',
        type: 'varchar',
        isNullable: true,
      }),
    )

    await queryRunner.createForeignKey(
      'store',
      new TableForeignKey({
        columnNames: ['payback_setting_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payback_setting',
        name: 'fk_store_payback_setting',
      }),
    )

    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'payback_setting_id',
        type: 'varchar',
        isNullable: true,
      }),
    )

    await queryRunner.createForeignKey(
      'user',
      new TableForeignKey({
        columnNames: ['payback_setting_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payback_setting',
        name: 'fk_user_payback_setting',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('store', 'fk_store_payback_setting')
    await queryRunner.dropColumn('store', 'payback_setting_id')
    await queryRunner.dropTable('payback_setting')
    await queryRunner.dropForeignKey('user', 'fk_user_payback_setting')
    await queryRunner.dropColumn('user', 'payback_setting_id')
  }
}
