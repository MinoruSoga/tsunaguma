import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { OrderCancelType } from '../entity/order.entity'

@Migration()
export class OrderMigration1669192893118 implements MigrationInterface {
  name = 'OrderMigration1669192893118'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "order_cancel_type_enum" AS ENUM(${Object.values(
        OrderCancelType,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.addColumns('order', [
      new TableColumn({
        name: 'cancel_reason',
        isNullable: true,
        type: 'varchar',
      }),
      new TableColumn({
        name: 'cancel_type',
        isNullable: true,
        enum: Object.values(OrderCancelType),
        type: 'enum',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('order', ['cancel_reason', 'cancel_type'])
    await queryRunner.query('DROP TYPE "order_cancel_type_enum"')
  }
}
