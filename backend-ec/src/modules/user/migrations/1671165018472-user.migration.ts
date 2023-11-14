import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class UserMigration1671165018472 implements MigrationInterface {
  name = 'UserMigration1671165018472'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user', [
      new TableColumn({
        name: 'gb_flg',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
      new TableColumn({
        name: 'latest_used_at',
        type: 'timestamptz',
        isNullable: false,
        default: 'now()',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('user', ['gb_flg', 'latest_used_at'])
  }
}
