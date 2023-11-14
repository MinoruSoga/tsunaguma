import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class LineItemMigration1666689423171 implements MigrationInterface {
  name = 'LineItemMigration1666689423171'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'line_item',
      new TableColumn({
        name: 'store_id',
        type: 'varchar',
        isNullable: false,
      }),
    )
    await queryRunner.createForeignKey(
      'line_item',
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('line_item', 'store_id')
  }
}
