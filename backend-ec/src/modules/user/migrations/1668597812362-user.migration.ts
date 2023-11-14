import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class UserMigration1668597812362 implements MigrationInterface {
  name = 'UserMigration1668597812362'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('address', [
      new TableColumn({
        name: 'is_show',
        default: true,
        type: 'bool',
        isNullable: false,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('address', ['is_show'])
  }
}
