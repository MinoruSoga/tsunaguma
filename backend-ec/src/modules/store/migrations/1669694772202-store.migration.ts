import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { StorePaymentMethod } from '../entity/store-detail.entity'

@Migration()
export class StoreMigration1669694772202 implements MigrationInterface {
  name = 'StoreMigration1669694772202'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "store_payment_method_enum" AS ENUM(${Object.values(
        StorePaymentMethod,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )
    await queryRunner.addColumns('store_detail', [
      new TableColumn({
        name: 'company_official_name',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'registration_number',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'payment_method',
        type: 'enum',
        isNullable: true,
        enum: Object.values(StorePaymentMethod),
      }),
      new TableColumn({
        name: 'referral_code',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp WITH time zone',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('store_detail', [
      'referral_code',
      'company_official_name',
      'registration_number',
      'payment_method',
    ])
    await queryRunner.dropColumn('store', 'deleted_at')

    await queryRunner.query('DROP TYPE "store_payment_method_enum"')
  }
}
