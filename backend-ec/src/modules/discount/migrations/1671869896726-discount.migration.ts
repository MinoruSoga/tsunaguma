import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class DiscountMigration1671869896726 implements MigrationInterface {
  name = 'DiscountMigration1671869896726'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'discount',
      new TableColumn({ name: 'store_id', isNullable: true, type: 'varchar' }),
    )

    await queryRunner.createForeignKey(
      'discount',
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        name: 'fk_store_discount',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('discount', 'fk_store_discount')
    await queryRunner.dropColumn('discount', 'store_id')
  }
}
