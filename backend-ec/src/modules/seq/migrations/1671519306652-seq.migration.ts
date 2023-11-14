import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm'

@Migration()
export class SeqMigration1671519306652 implements MigrationInterface {
  name = 'SeqMigration1671519306652'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'product_type',
      new TableColumn({
        name: 'display_id',
        type: 'serial4',
      }),
    )
    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'display_id',
        type: 'serial4',
      }),
    )
    await queryRunner.addColumn(
      'customer',
      new TableColumn({
        name: 'display_id',
        type: 'serial4',
      }),
    )
    await queryRunner.addColumns('product', [
      new TableColumn({
        name: 'display_id',
        type: 'serial4',
      }),
      new TableColumn({
        name: 'display_code',
        type: 'varchar',
        default: '0',
      }),
    ])
    await queryRunner.createTable(
      new Table({
        name: 'seq_master',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'seq',
            type: 'integer',
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
      }),
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product_type', 'display_id')
    await queryRunner.dropColumn('store', 'display_id')
    await queryRunner.dropColumn('customer', 'display_id')
    await queryRunner.dropColumns('product', ['display_id', 'display_code'])
    await queryRunner.dropTable('seq_master')
  }
}
