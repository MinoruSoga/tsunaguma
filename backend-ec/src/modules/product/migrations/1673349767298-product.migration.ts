import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1673349767298 implements MigrationInterface {
  name = 'ProductMigration1673349767298'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropPrimaryKey('product_specs')
    await queryRunner.addColumn(
      'product_specs',
      new TableColumn({
        name: 'id',
        type: 'serial',
        isNullable: false,
        isPrimary: true,
      }),
    )
  }
  public async down(queryRunner: QueryRunner): Promise<any> {
    return
  }
}
