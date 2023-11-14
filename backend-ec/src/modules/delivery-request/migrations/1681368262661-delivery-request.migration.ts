import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class DeliveryRequestMigration1681368262661
  implements MigrationInterface
{
  name = 'DeliveryRequestMigration1681368262661'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'delivery_request_variant',
        columns: [
          {
            name: 'variant_id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'delivery_request_id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'delivery_quantity',
            type: 'integer',
            default: 0,
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
        ],
        foreignKeys: [
          {
            name: 'fk_delivery_request_variant',
            columnNames: ['variant_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_variant',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_delivery_request_request',
            columnNames: ['delivery_request_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'delivery_request',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('delivery_request_variant')
  }
}
