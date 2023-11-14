import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class StoreMigration1671112628425 implements MigrationInterface {
  name = 'StoreMigration1671112628425'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'follow_cnt',
        type: 'integer',
        default: 0,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'follow_cnt')
  }
}
