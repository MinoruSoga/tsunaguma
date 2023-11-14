import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { DeliveryRequestAdminStatus } from '../entities/delivery-request.entity'

@Migration()
export class DeliveryRequestMigration1685527828904
  implements MigrationInterface
{
  name = 'DeliveryRequestMigration1685527828904'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "delivery_request_admin_status" AS ENUM(${Object.values(
        DeliveryRequestAdminStatus,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.addColumn(
      'delivery_request',
      new TableColumn({
        name: 'admin_status',
        type: 'enum',
        enum: Object.values(DeliveryRequestAdminStatus),
        isNullable: true,
      }),
    )

    const query =
      "UPDATE delivery_request SET admin_status = (case when status = 'draft' then 'draft' when status = 'pending' then 'new_request' when status = 'cancelled' then 'cancelled' when status = 'deleted' then 'deleted' else admin_status end)"
    await queryRunner.query(query)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('delivery_request', 'admin_status')
  }
}
