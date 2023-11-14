import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class DiscountMigration1684382526939 implements MigrationInterface {
  name = 'DiscountMigration1684382526939'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'discount',
      new TableColumn({
        name: 'is_target_user',
        type: 'bool',
        isNullable: false,
        default: false,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('discount', 'is_target_user')
  }
}
