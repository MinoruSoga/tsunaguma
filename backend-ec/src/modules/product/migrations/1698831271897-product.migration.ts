import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1698831271897 implements MigrationInterface {
  name = 'ProductMigration1698831271897'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product_variant', [
      new TableColumn({
        name: 'varaint_no',
        type: 'integer',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('product_variant', ['varaint_no'])
  }
}
