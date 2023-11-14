import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class ProductMigration1677164527313 implements MigrationInterface {
  name = 'ProductMigration1677164527313'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'product_reviews',
      new TableColumn({
        name: 'line_item_id',
        type: 'varchar',
        isNullable: true,
      }),
    )

    await queryRunner.createForeignKey(
      'product_reviews',
      new TableForeignKey({
        name: 'product_reviews_line_item',
        columnNames: ['line_item_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'line_item',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product_reviews', 'line_item_id')
  }
}
