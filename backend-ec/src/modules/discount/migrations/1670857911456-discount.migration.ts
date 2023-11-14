import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { DiscountType } from '../entities/discount.entity'

@Migration()
export class DiscountMigration1670857911456 implements MigrationInterface {
  name = 'DiscountMigration1670857911456'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "discount_type_enum" AS ENUM(${Object.values(DiscountType)
        .map((val) => `'${val}'`)
        .join(',')})`,
    )
    await queryRunner.addColumn(
      'discount',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: Object.values(DiscountType),
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('discount', 'type')
    await queryRunner.query('DROP TYPE "discount_type_enum"')
  }
}
