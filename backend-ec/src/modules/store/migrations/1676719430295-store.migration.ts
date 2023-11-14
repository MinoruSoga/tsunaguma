import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class StoreMigration1676719430295 implements MigrationInterface {
  name = 'StoreMigration1676719430295'

  // add init_rank field

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'store',
      new TableColumn({ name: 'init_rank', type: 'boolean', default: false }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'init_rank')
  }
}
