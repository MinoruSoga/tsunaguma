import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ChattingMigration1698665065994 implements MigrationInterface {
  name = 'ChattingMigration1698665065994'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('chatting_thread', [
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])

    await queryRunner.addColumns('chatting_message', [
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('chatting_thread', ['deleted_at'])
    await queryRunner.dropColumns('chatting_message', ['deleted_at'])
  }
}
