import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class NotificationMigration1669690427302 implements MigrationInterface {
  name = 'NotificationMigration1669690427302'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification_settings', true)
    await queryRunner.createTable(
      new Table({
        name: 'notification_settings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_newletter',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'is_points',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'is_favorite',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'is_review',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'is_newproducts_follow',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'is_permission_sns',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'is_coupon',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            name: 'fk_notification_setting_user',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'notification-settings',
      'fk_notification_setting_user',
    )
    await queryRunner.dropTable('notification-settings')
  }
}
