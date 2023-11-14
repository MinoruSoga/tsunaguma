import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class ContactMigration1671182635770 implements MigrationInterface {
  name = 'ContactMigration1671182635770'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inquiry', true)
    await queryRunner.createTable(
      new Table({
        name: 'inquiry',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'first_name',
            type: 'varchar',
          },
          {
            name: 'last_name',
            type: 'varchar',
          },
          {
            name: 'first_name_kana',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_name_kana',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'smallint',
            default: 0,
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inquiry', true)
  }
}
