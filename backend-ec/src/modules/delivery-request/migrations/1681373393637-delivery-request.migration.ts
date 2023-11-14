import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class DeliveryRequestMigration1681373393637
  implements MigrationInterface
{
  name = 'DeliveryRequestMigration1681373393637'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('delivery_request', [
      new TableColumn({
        name: 'canceled_at',
        type: 'timestamptz',
        isNullable: true,
      }),
      new TableColumn({
        name: 'delivered_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('delivery_request', [
      'canceled_at',
      'delivered_at',
    ])
  }
}
