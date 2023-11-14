import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class ShippingMigration1672970507111 implements MigrationInterface {
  name = 'ShippingMigration1672970507111'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'fulfillment_price',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'provider_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'size',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'from_pref_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'to_pref_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'price',
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
        ],
        foreignKeys: [
          {
            columnNames: ['from_pref_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'prefecture',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['to_pref_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'prefecture',
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
    await queryRunner.dropTable('fulfillment_price', true)
  }
}
