import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class StoreMigration1669339495364 implements MigrationInterface {
  name = 'StoreMigration1669339495364'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'store_billing',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'transfer_type',
            type: 'enum',
            enum: ['manual', 'auto'],
            isNullable: true,
          },
          {
            name: 'total_origin_price',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_delivery_price',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_discount_coupon',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_fee',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_discount_campaign',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_discount_promotion',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_coupon_used',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'total_price',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'tax_price',
            type: 'integer',
            isNullable: false,
            default: 0,
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
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
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
    await queryRunner.dropTable('store_billing', true)
  }
}
