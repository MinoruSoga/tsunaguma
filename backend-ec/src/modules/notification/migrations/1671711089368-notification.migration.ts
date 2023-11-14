import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { NotificationType } from '../entities/notification.entity'

@Migration()
export class NotificationMigration1671711089368 implements MigrationInterface {
  name = 'NotificationMigration1671711089368'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "notification_type_enum" AS ENUM(${Object.values(
        NotificationType,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.addColumn(
      'notification',
      new TableColumn({
        name: 'noti_type',
        type: 'enum',
        isNullable: true,
        enum: Object.values(NotificationType),
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('notification', ['noti_type'])
    await queryRunner.query('DROP TYPE "notification_type_enum"')
  }
}
