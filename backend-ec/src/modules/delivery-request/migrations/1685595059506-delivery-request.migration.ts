import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class DeliveryRequestVariantMigration1685595059506
  implements MigrationInterface
{
  name = 'DeliveryRequestVariantMigration1685595059506'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'delivery_request_variant',
      new TableColumn({
        name: 'different_quantity_flag',
        type: 'boolean',
        isNullable: true,
      }),
    )

    await queryRunner.addColumn(
      'delivery_request_variant',
      new TableColumn({
        name: 'different_quantity',
        type: 'integer',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'delivery_request_variant',
      'different_quantity_flag',
    )
    await queryRunner.dropColumn(
      'delivery_request_variant',
      'different_quantity',
    )
  }
}
