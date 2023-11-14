import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm'

@Migration()
export class CartMigration1669036516168 implements MigrationInterface {
  name = 'CartMigration1669036516168'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'line_item',
      'fk_line_item_shipping_method',
    )

    await queryRunner.createForeignKey(
      'line_item',
      new TableForeignKey({
        name: 'fk_line_item_shipping_method',
        columnNames: ['shipping_method_id'],
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'SET NULL',
        referencedTableName: 'shipping_method',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const query = ''
    await queryRunner.query(query)
  }
}
