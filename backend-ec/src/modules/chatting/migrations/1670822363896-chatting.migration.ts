import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ChattingMigration1670822363896 implements MigrationInterface {
  name = 'ChattingMigration1670822363896'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('chatting_thread', [
      new TableColumn({
        isGenerated: true,
        generationStrategy: 'increment',
        type: 'int',
        name: 'display_id',
        isNullable: false,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('chatting_thread', ['display_id'])
  }
}
