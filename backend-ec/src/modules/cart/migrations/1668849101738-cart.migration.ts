import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class CartMigration1668849101738 implements MigrationInterface {
  name = 'CartMigration1668849101738'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('cart', [
      new TableColumn({
        name: 'gift_cover_total',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'addon_total',
        type: 'integer',
        default: 0,
      }),
    ])

    await queryRunner.addColumns('line_item', [
      new TableColumn({
        name: 'gift_cover_total',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'shipping_total',
        type: 'integer',
        default: 0,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('cart', ['gift_cover_total', 'addon_total'])
    await queryRunner.dropColumns('line_item', [
      'gift_cover_total',
      'shipping_total',
    ])
  }
}
