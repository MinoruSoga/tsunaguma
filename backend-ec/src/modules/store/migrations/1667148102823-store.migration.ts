import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

const prodOpts = [
  { code: 'color', name: 'カラー' },
  { code: 'size', name: 'サイズ' },
]

@Migration()
export class StoreMigration1667148102823 implements MigrationInterface {
  name = 'StoreMigration1667148102823'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'product_addon',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'parent_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'int',
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
        foreignKeys: [
          {
            columnNames: ['parent_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_addon',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
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
      true,
    )

    const query = `INSERT INTO "product_option" ("id", "title") VALUES ($1, $2)`
    for (const { code, name } of prodOpts) {
      await queryRunner.query(query, ['opt_' + code, name])
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('product_addon', true)
    await queryRunner.query(
      'DELETE FROM "product_option" WHERE "id" IN (' +
        prodOpts.map(({ code }) => `'opt_${code}'`).join(',') +
        ')',
    )
  }
}
