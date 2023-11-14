import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1667535387251 implements MigrationInterface {
  name = 'ProductMigration1667535387251'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product_size', [
      new TableColumn({
        type: 'int',
        name: 'rank',
        isNullable: false,
      }),
      new TableColumn({
        name: 'is_selectable',
        type: 'bool',
        isNullable: false,
        default: false,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('product_size', ['rank', 'is_selectable'])
  }
}
