import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm'

@Migration()
export class DeliveryRequestMigration1681889133676
  implements MigrationInterface
{
  name = 'DeliveryRequestMigration1681889133676'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'delivery_request_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'delivery_request_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
            columnNames: ['created_by'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['delivery_request_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'delivery_request',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    await queryRunner.addColumns('delivery_request', [
      new TableColumn({
        name: 'redelivery_flag',
        type: 'boolean',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('delivery_request_history', true, true, true)

    await queryRunner.dropColumns('delivery_request', ['redelivery_flag'])
  }
}
