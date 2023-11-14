import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class UserCouponMigration1683774232926 implements MigrationInterface {
  name = 'User_couponMigration1683774232926'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_coupon',
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'discount_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_user_coupon_user',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_user_coupon_discount',
            columnNames: ['discount_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'discount',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    await queryRunner.createPrimaryKey('user_coupon', [
      'user_id',
      'discount_id',
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('user_coupon', 'fk_user_coupon_user')
    await queryRunner.dropForeignKey('user_coupon', 'fk_user_coupon_discount')
    await queryRunner.dropTable('user_coupon')
  }
}
