import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm'

import { IssuanceTimingEnum, StoreApplyEnum } from '../entities/discount.entity'

@Migration()
export class DiscountMigration1683686575506 implements MigrationInterface {
  name = 'DiscountMigration1683686575506'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'store_group',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'varchar',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
      true,
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'store_group_stores',
        columns: [
          {
            name: 'store_group_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_store_group_stores_store',
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_store_group_stores_store_group',
            columnNames: ['store_group_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store_group',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    await queryRunner.createPrimaryKey('store_group_stores', [
      'store_group_id',
      'store_id',
    ])

    await queryRunner.createTable(
      new Table({
        name: 'discount_condition_store_group',
        columns: [
          {
            name: 'store_group_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'condition_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_discount_condition_store_group_store_group',
            columnNames: ['store_group_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store_group',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_discount_condition_store_group_discount_condition',
            columnNames: ['condition_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'discount_condition',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    await queryRunner.query(
      `CREATE TYPE "store_apply_enum" AS ENUM(${Object.values(StoreApplyEnum)
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.query(
      `CREATE TYPE "issuance_timing_enum" AS ENUM(${Object.values(
        IssuanceTimingEnum,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.addColumns('discount', [
      new TableColumn({
        name: 'thumbnail',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_sale',
        type: 'bool',
        isNullable: false,
        default: false,
      }),
      new TableColumn({
        name: 'terms_of_use',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'payback_rate',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'store_apply',
        isNullable: true,
        enum: Object.values(StoreApplyEnum),
        type: 'enum',
      }),
      new TableColumn({
        name: 'issuance_timing',
        isNullable: true,
        enum: Object.values(IssuanceTimingEnum),
        type: 'enum',
      }),
      new TableColumn({
        name: 'amount_limit',
        type: 'int',
        isNullable: true,
      }),
    ])

    await queryRunner.query(
      `ALTER TYPE discount_condition_type_enum ADD VALUE IF NOT EXISTS 'store_groups'  after 'customer_groups'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'store_group_stores',
      'fk_store_group_stores_store',
    )
    await queryRunner.dropForeignKey(
      'store_group_stores',
      'fk_store_group_stores_store',
    )
    await queryRunner.dropForeignKey(
      'discount_condition_store_group',
      'fk_discount_condition_store_group_store_group',
    )
    await queryRunner.dropForeignKey(
      'discount_condition_store_group',
      'fk_discount_condition_store_group_discount_condition',
    )
    await queryRunner.dropTable('store_group')
    await queryRunner.dropTable('store_group_stores')
    await queryRunner.dropTable('discount_condition_store_group')

    await queryRunner.dropColumns('discount', [
      'thumbnail',
      'is_sale',
      'terms_of_use',
      'payback_rate',
      'store_apply',
      'issuance_timing',
      'lower_limit',
      'sheets_count',
    ])

    await queryRunner.query('DROP TYPE "store_apply_enum"')
    await queryRunner.query('DROP TYPE "issuance_timing_enum"')
  }
}
