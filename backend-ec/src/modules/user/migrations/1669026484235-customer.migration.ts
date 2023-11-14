import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class CustomerMigration1669026484235 implements MigrationInterface {
  name = 'CustomerMigration1669026484235'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('customer', [
      new TableColumn({
        name: 'nickname',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'avatar',
        type: 'varchar',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('customer', ['nickname', 'avatar'])
  }
}
