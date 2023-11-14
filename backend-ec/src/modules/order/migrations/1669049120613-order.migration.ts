import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { OrderCancelStatus } from '../entity/order.entity'

@Migration()
export class OrderMigration1669049120613 implements MigrationInterface {
  name = 'OrderMigration1669049120613'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "order_cancel_status_enum" AS ENUM(${Object.values(
        OrderCancelStatus,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.addColumn(
      'order',
      new TableColumn({
        name: 'cancel_status',
        type: 'enum',
        isNullable: true,
        enum: Object.values(OrderCancelStatus),
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('order', 'cancel_status')
    await queryRunner.query('DROP TYPE "order_cancel_status_enum"')
  }
}
