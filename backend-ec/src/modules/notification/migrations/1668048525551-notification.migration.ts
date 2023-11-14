import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class NotificationMigration1668048525551 implements MigrationInterface {
  name = 'NotificationMigration1668048525551'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('notification', [
      new TableColumn({
        name: 'user_read',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('notification', [
      'user_read',
      'deleted_at',
      'metadata',
    ])
  }
}
