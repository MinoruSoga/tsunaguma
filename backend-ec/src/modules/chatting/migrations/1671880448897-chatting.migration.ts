import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ChattingMigration1671880448897 implements MigrationInterface {
  name = 'ChattingMigration1671880448897'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('chatting_thread', [
      new TableColumn({
        name: 'last_message_by',
        type: 'varchar',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('chatting_thread', ['last_message_by'])
  }
}
