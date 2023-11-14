import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1670562256905 implements MigrationInterface {
  name = 'Product Migration1670562256905'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'product_size',
      'unit',
      new TableColumn({
        name: 'unit',
        type: 'varchar',
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'product_size',
      'unit',
      new TableColumn({
        name: 'unit',
        type: 'varchar',
        isNullable: false,
        default: '',
      }),
    )
  }
}
