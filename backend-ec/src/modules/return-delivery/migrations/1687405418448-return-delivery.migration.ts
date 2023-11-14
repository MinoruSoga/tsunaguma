import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

import {
  ReturnDeliveryOriginEnum,
  ReturnDeliveryStatus,
} from '../entities/return-delivery.entity'

@Migration()
export class ReturnDeliveryMigration1687405418448
  implements MigrationInterface
{
  name = 'ReturnDeliveryMigration1687405418448'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "return_delivery_origin_enum" AS ENUM(${Object.values(
        ReturnDeliveryOriginEnum,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.query(
      `CREATE TYPE "return_delivery_status" AS ENUM(${Object.values(
        ReturnDeliveryStatus,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.createTable(
      new Table({
        name: 'return_delivery',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'varchar',
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'variant_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'integer',
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(ReturnDeliveryStatus),
            isNullable: true,
          },
          {
            name: 'origin',
            type: 'enum',
            enum: Object.values(ReturnDeliveryOriginEnum),
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'note',
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
            isGenerated: true,
            generationStrategy: 'increment',
            type: 'bigint',
            name: 'display_id',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_pause',
            type: 'bool',
            isNullable: false,
            default: false,
          },
          {
            name: 'delivery_slip_no',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'shipped_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_return_delivery_store',
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_return_delivery_variant',
            columnNames: ['variant_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_variant',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'return_delivery_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'return_delivery_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
            columnNames: ['created_by'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['return_delivery_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'return_delivery',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('return_delivery', true, true, true)
    await queryRunner.query('DROP TYPE "return_delivery_origin_enum"')
    await queryRunner.query('DROP TYPE "return_delivery_status"')
    await queryRunner.dropTable('return_delivery_history', true, true, true)
  }
}
