import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1676706870074 implements MigrationInterface {
  name = 'ProductMigration1676706870074'

  // add shop rank fields to product

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'product',
      new TableColumn({ name: 'shop_rank', type: 'integer', default: 0 }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product', 'shop_rank')
  }
}
