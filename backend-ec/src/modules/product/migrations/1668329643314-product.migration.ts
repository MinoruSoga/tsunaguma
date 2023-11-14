import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1668329643314 implements MigrationInterface {
  name = 'ProductMigration1668329643314'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'product_type',
      new TableColumn({
        name: 'thumbnail',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product_type', 'thumbnail')
  }
}
