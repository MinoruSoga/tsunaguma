import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class ProductMigration1667834578169 implements MigrationInterface {
  name = 'ProductMigration1667834578169'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_shipping_options',
        columns: [
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'shipping_option_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'bulk_added_price',
            type: 'int',
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
            columnNames: ['product_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['shipping_option_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'shipping_option',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    await queryRunner.createPrimaryKey('product_shipping_options', [
      'product_id',
      'shipping_option_id',
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_shipping_options')
  }
}
