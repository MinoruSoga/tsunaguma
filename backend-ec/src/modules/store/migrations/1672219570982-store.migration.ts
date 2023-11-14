import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class StoreMigration1672219570982 implements MigrationInterface {
  name = 'StoreMigration1672219570982'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'return_guarantee',
        type: 'boolean',
        default: false,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'return_guarantee')
  }
}
