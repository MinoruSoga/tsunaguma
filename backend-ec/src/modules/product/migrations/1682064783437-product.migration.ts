import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1682064783437 implements MigrationInterface {
  name = 'ProductMigration1682064783437'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'product_variant',
      new TableColumn({
        name: 'is_deleted',
        type: 'boolean',
        default: false,
      }),
    )

    // await queryRunner.query(`
    //    UPDATE public.product_variant SET deleted_at = null, is_deleted = true WHERE deleted_at IS NOT null
    // `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('product_variant', 'is_deleted')
  }
}
