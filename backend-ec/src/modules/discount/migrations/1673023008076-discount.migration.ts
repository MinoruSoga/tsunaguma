import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

@Migration()
export class DiscountMigration1673023008076 implements MigrationInterface {
  name = 'DiscountMigration1673023008076'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_discount',
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'discount_id',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            name: 'fk_user_discount_user',
          },
          {
            columnNames: ['discount_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'discount',
            name: 'fk_user_discount_discount',
          },
        ],
      }),
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_discount')
  }
}
