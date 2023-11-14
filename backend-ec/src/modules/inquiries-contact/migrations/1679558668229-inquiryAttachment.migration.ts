import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class InquiryAttachmentMigration1679558668229
  implements MigrationInterface
{
  name = 'InquiryAttachmentMigration1679558668229'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inquiry_attachment',
        columns: [
          {
            name: 'inquiry_id',
            isPrimary: true,
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'attachment_id',
            isPrimary: true,
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_at',
            default: 'now()',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'updated_at',
            default: 'now()',
            type: 'timestamptz',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['inquiry_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'inquiry',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['attachment_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'attachment',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inquiry_attachment', true)
  }
}
