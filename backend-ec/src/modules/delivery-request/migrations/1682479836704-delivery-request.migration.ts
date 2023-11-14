import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class DeliveryRequestMigration1682479836704
  implements MigrationInterface
{
  name = 'DeliveryRequestMigration1682479836704'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'delivery_request',
      new TableColumn({
        name: 'rank',
        type: 'bigint',
        default: 0,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('delivery_request', 'rank')
  }
}
