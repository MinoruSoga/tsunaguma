import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class CustomerMigration1695627050355 implements MigrationInterface {
  name = 'CustomerMigration1695627050355'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customer', 'cart_id')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'customer',
      new TableColumn({
        name: 'cart_id',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }
}
