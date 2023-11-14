import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1673089283580 implements MigrationInterface {
  name = 'ProductMigration1673089283580'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'image',
      'store_id',
      new TableColumn({
        isNullable: true,
        name: 'store_id',
        type: 'varchar',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'image',
      'store_id',
      new TableColumn({
        isNullable: false,
        name: 'store_id',
        type: 'varchar',
      }),
    )
  }
}
