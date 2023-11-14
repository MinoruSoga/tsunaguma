import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class StoreMigration1672643230760 implements MigrationInterface {
  name = 'StoreMigration1672643230760'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'new_transaction_cnt',
        type: 'integer',
        default: 0,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'new_transaction_cnt')
  }
}
