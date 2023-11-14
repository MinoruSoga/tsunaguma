import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class DiscountMigration1673254062646 implements MigrationInterface {
  name = 'DiscountMigration1673254062646'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('discount', [
      new TableColumn({
        name: 'owner_store_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'title',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKey(
      'discount',
      new TableForeignKey({
        columnNames: ['owner_store_id'],
        referencedColumnNames: ['id'],
        name: 'fk_discount_owner_store_id',
        referencedTableName: 'store',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('discount', ['owner_store_id', 'title'])
  }
}
