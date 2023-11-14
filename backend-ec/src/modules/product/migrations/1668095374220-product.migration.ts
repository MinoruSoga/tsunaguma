import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1668095374220 implements MigrationInterface {
  name = 'ProductMigration1668095374220'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'product_specs',
      'lv2_id',
      new TableColumn({
        name: 'lv2_id',
        type: 'varchar',
        isNullable: true,
      }),
    )
    await queryRunner.changeColumn(
      'product_specs',
      'lv3_id',
      new TableColumn({
        name: 'lv3_id',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'product_specs',
      'lv2_id',
      new TableColumn({
        name: 'lv2_id',
        type: 'varchar',
        isNullable: false,
      }),
    )
    await queryRunner.changeColumn(
      'product_specs',
      'lv3_id',
      new TableColumn({
        name: 'lv3_id',
        type: 'varchar',
        isNullable: false,
      }),
    )
  }
}
