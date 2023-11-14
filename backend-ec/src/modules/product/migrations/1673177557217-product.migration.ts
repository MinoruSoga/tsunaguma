import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1673177557217 implements MigrationInterface {
  name = 'ProductMigration1673177557217'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product', [
      new TableColumn({
        name: 'is_soldout',
        type: 'bool',
        isNullable: true,
        default: false,
      }),
      new TableColumn({
        name: 'price',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'sale_price',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'sale_from',
        type: 'timestamptz',
        isNullable: true,
      }),
      new TableColumn({
        name: 'sale_to',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('product', [
      'is_soldout',
      'price',
      'sale_price',
      'sale_from',
      'sale_to',
    ])
  }
}
