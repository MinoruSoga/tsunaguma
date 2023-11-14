import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class UserMigration1679888409551 implements MigrationInterface {
  name = 'UserMigration1679888409551'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'old_status',
        type: 'store_status_enum',
        isNullable: true,
      }),
    )

    await queryRunner.addColumn(
      'product',
      new TableColumn({
        name: 'old_status',
        type: 'product_status_enum',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'old_status')
    await queryRunner.dropColumn('product', 'old_status')
  }
}
