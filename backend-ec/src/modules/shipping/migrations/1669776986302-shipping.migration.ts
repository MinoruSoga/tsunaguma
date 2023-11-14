import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ShippingMigration1669776986302 implements MigrationInterface {
  name = 'ShippingMigration1669776986302'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('shipping_option', [
      new TableColumn({
        name: 'is_trackable',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'is_warranty',
        type: 'boolean',
        default: false,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('shipping_option', [
      'is_trackable',
      'is_warranty',
    ])
  }
}
