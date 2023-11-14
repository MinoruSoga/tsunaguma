import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

@Migration()
export class DiscountMigration1682091367322 implements MigrationInterface {
  name = 'DiscountMigration1682091367322'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'promotion_code_master',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'varchar',
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'code',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_available',
            type: 'boolean',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'ends_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'starts_at',
            type: 'timestamptz',
            default: 'current_timestamp',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_promotion_code_master_store',
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
    )

    await queryRunner.createIndices('promotion_code_master', [
      new TableIndex({
        name: 'store_promotion_code_master_unique',
        columnNames: ['store_id', 'code'],
        where: 'store_id IS NOT NULL',
        isUnique: true,
      }),
      new TableIndex({
        name: 'code_master_unique',
        columnNames: ['code'],
        isUnique: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('promotion_code_master')
  }
}
