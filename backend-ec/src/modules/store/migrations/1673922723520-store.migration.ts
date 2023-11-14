import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class StoreMigration1673922723520 implements MigrationInterface {
  name = 'StoreMigration1673922723520'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'product_addon',
      new TableColumn({ name: 'rank', type: 'integer', default: 1 }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product_addon', 'rank')
  }
}
