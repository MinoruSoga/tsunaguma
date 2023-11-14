import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class DeliveryRequestMigration1685374602610
  implements MigrationInterface
{
  name = 'DeliveryRequestMigration1685374602610'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'delivery_request',
      new TableColumn({
        name: 'released_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    )

    const query =
      "UPDATE delivery_request SET released_at = updated_at FROM (select id from public.delivery_request dr  where status <> 'draft') AS del WHERE delivery_request.id=del.id"
    await queryRunner.query(query)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('delivery_request', 'released_at')
  }
}
