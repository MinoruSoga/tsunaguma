import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class NotificationMigration1672299712225 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notification',
      new TableColumn({ name: 'from_id', type: 'varchar', isNullable: true }),
    )

    await queryRunner.createForeignKey(
      'notification',
      new TableForeignKey({
        columnNames: ['from_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        name: 'fk_notification_from_user',
        onDelete: 'SET NULL',
        onUpdate: 'SET NULL',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'notification',
      'fk_notification_from_user',
    )
    await queryRunner.dropColumn('notification', 'from_id')
  }
}
