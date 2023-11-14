import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class OrderMigration1652101349791 implements MigrationInterface {
  name = 'OrderMigration1652101349791'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('order', [
      new TableColumn({
        name: 'store_id',
        type: 'varchar',
      }),
      new TableColumn({
        name: 'parent_id',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKeys('order', [
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'order',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('order', ['store_id', 'parent_id'])
  }
}
