import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { ShippingOptionStatusEnum } from '../entities/shipping-option.entity'

@Migration()
export class ShippingMigration1679985989447 implements MigrationInterface {
  name = 'ShippingMigration1679985989447'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE  "shipping_option_status_enum"  AS ENUM(${Object.values(
        ShippingOptionStatusEnum,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.addColumn(
      'shipping_option',
      new TableColumn({
        name: 'status',
        type: 'shipping_option_status_enum',
        isNullable: false,
        default: `'${ShippingOptionStatusEnum.ACTIVE}'`,
      }),
    )

    // restore deleted shipping option, and change status
    await queryRunner.query(
      `UPDATE public.shipping_option SET status = '${ShippingOptionStatusEnum.DELETED}', deleted_at = NULL WHERE deleted_at IS NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('shipping_option', 'status')
    await queryRunner.query('DROP TYPE "shipping_option_status_enum"')
  }
}
