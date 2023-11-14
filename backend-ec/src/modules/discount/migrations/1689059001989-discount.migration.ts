import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class DiscountMigration1689059001989 implements MigrationInterface {
  name = 'DiscountMigration1689059001989'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'discount',
      new TableColumn({
        name: 'store_target_group',
        isNullable: true,
        type: 'varchar',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('discount', 'store_target_group')
  }
}
