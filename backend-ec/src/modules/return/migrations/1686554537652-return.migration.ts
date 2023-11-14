import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ReturnMigration1686554537652 implements MigrationInterface {
  name = 'ReturnMigration1686554537652'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'return',
      new TableColumn({
        name: 'is_pause',
        type: 'bool',
        isNullable: false,
        default: false,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('return', 'is_pause')
  }
}
