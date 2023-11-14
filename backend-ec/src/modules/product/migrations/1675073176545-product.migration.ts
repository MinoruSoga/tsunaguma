import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1675073176545 implements MigrationInterface {
  name = 'ProductMigration1675073176545'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'product_shipping_options',
      new TableColumn({
        name: 'rank',
        type: 'integer',
        isNullable: false,
        default: 0,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product_shipping_options', 'rank')
  }
}
