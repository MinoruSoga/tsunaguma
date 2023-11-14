import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class UserMigration1667188147301 implements MigrationInterface {
  name = 'UserMigration1667188147301'

  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.createTable(
      new Table({
        name: 'recent_view',
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'data',
            type: 'jsonb',
            isNullable: false,
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
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('recent_view')
  }
}
