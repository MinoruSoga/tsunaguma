import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1667356666463 implements MigrationInterface {
  name = 'ProductMigration1667356666463'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product_type', [
      new TableColumn({
        type: 'int',
        name: 'rank',
        isNullable: false,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('product_type', ['rank'])
  }
}
