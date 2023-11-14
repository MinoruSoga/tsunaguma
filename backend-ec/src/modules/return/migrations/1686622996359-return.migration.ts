import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm'

import { OriginEnum } from '../entities/return.entity'

@Migration()
export class ReturnMigration1686622996359 implements MigrationInterface {
  name = 'ReturnMigration1686622996359'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "origin_enum" AS ENUM(${Object.values(OriginEnum)
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.addColumns('return', [
      new TableColumn({
        name: 'origin',
        type: 'enum',
        enum: Object.values(OriginEnum),
        isNullable: true,
      }),
      new TableColumn({
        name: 'reason',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createTable(
      new Table({
        name: 'return_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'return_id',
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
            columnNames: ['return_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'return',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    const query = `UPDATE public."return" r SET origin = 'requested' WHERE origin IS NULL`
    await queryRunner.query(query)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('return', ['origin', 'reason'])
    await queryRunner.dropTable('return_history', true, true, true)
  }
}
