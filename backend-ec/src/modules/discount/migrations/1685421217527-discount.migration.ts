import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { DiscountStatus } from '../entities/discount.entity'

@Migration()
export class DiscountMigration1685421217527 implements MigrationInterface {
  name = 'DiscountMigration1685421217527'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "discount_status_enum" AS ENUM(${Object.values(
        DiscountStatus,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.addColumn(
      'discount',
      new TableColumn({
        name: 'status',
        isNullable: true,
        enum: Object.values(DiscountStatus),
        type: 'enum',
      }),
    )

    await queryRunner.query(`
       UPDATE public.discount SET status = 'published'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('discount', 'status')
    await queryRunner.query('DROP TYPE "discount_status_enum"')
  }
}
