import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class StoreMigration1669717908037 implements MigrationInterface {
  name = 'StoreMigration1669717908037'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'approved_at',
        type: 'timestamp WITH time zone',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'approved_at')
  }
}
