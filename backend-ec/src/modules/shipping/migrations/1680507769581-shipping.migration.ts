import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ShippingMigration1680507769581 implements MigrationInterface {
  name = 'ShippingMigration1680507769581'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('fulfillment_provider', [
      new TableColumn({ name: 'rank', type: 'integer', default: 0 }),
      new TableColumn({ name: 'is_show', type: 'boolean', default: true }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('fulfillment_provider', ['rank', 'is_show'])
  }
}
