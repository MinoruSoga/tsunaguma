import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class LineItemMigration1668487642871 implements MigrationInterface {
  name = 'Line-itemMigration1668487642871'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('line_item', [
      new TableColumn({
        name: 'addon_subtotal_price',
        type: 'integer',
        isNullable: false,
        default: 0,
      }),
      new TableColumn({
        name: 'shipping_method_id',
        type: 'varchar',
        isNullable: true,
      }),
    ])
    await queryRunner.createForeignKey(
      'line_item',
      new TableForeignKey({
        name: 'fk_line_item_shipping_method',
        columnNames: ['shipping_method_id'],
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        referencedTableName: 'shipping_method',
      }),
    )

    await queryRunner.createTable(
      new Table({
        name: 'line_item_addons',
        columns: [
          {
            name: 'line_item_id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'lv1_id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'lv2_id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'price',
            type: 'integer',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['lv1_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_addon',
            name: 'fk_addon_line_item_lv1',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['lv2_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_addon',
            name: 'fk_addon_line_item_lv2',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['line_item_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'line_item',
            name: 'fk_addon_line_item',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'line_item',
      'fk_line_item_shipping_method',
    )
    await queryRunner.dropColumns('line_item', [
      'shipping_method_id',
      'addon_subtotal_price',
    ])

    await queryRunner.dropTable('line_item_addons')
  }
}
