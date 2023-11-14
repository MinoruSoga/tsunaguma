import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class PrefectureMigration1671109520458 implements MigrationInterface {
  name = 'PrefectureMigration1671109520458'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'postcode',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'pref_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'pref_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'addr_1',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'addr_2',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_office',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'office_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'office_name_kana',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'office_addr',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'office_cd',
            type: 'varchar',
            isNullable: true,
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
      }),
      true,
      true,
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('postcode', true)
  }
}
