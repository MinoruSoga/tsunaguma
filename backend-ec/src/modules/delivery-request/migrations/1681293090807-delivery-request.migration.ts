import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm'

import { DeliveryRequestStatus } from '../entities/delivery-request.entity'

@Migration()
export class DeliveryRequestMigration1681293090807
  implements MigrationInterface
{
  name = 'DeliveryRequestMigration1681293090807'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // create delivery request table
    await queryRunner.createTable(
      new Table({
        name: 'delivery_request',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'varchar',
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'suggested_price',
            type: 'integer',
            isNullable: true,
          },
          // {
          //   name: 'available_date',
          //   type: 'timestamptz',
          //   default: 'now()',
          //   isNullable: true,
          // },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(DeliveryRequestStatus),
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
            name: 'shooting',
            type: 'smallint',
            isNullable: true,
          },
          {
            name: 'background_type',
            type: 'smallint',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'varchar',
            isNullable: true,
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
            name: 'total_stock',
            type: 'integer',
            default: 0,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_delivery_request_store',
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_delivery_request_product',
            columnNames: ['product_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product',
            onDelete: 'SET NULL',
            onUpdate: 'SET NULL',
          },
          {
            name: 'fk_delivery_request_parent',
            columnNames: ['parent_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'delivery_request',
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
      true,
    )

    // add fields to product variant table
    await queryRunner.addColumns('product_variant', [
      new TableColumn({
        name: 'threshold_quantity',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'restocking_responsive',
        type: 'boolean',
        isNullable: true,
      }),
    ])

    // add delivery request status to ProductStatusEnum
    await queryRunner.query(
      `ALTER TYPE product_status_enum ADD VALUE IF NOT EXISTS 'delivery_request'  after 'deleted'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('delivery_request')
    await queryRunner.dropColumns('product_variant', [
      'threshold_quantity',
      'restocking_responsive',
    ])
  }
}
