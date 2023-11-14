import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1668075510559 implements MigrationInterface {
  name = 'ProductMigration1668075510559'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'product_addons',
      'lv2_id',
      new TableColumn({
        name: 'lv2_id',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'product_addons',
      'lv2_id',
      new TableColumn({
        name: 'lv2_id',
        type: 'varchar',
        isNullable: false,
      }),
    )
  }
}
