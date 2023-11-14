import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1672238352378 implements MigrationInterface {
  name = 'ProductMigration1672238352378'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product', [
      new TableColumn({
        name: 'is_prime',
        type: 'bool',
        isNullable: true,
        default: false,
      }),
      new TableColumn({
        name: 'is_return_guarantee',
        type: 'bool',
        isNullable: true,
        default: false,
      }),
      new TableColumn({
        name: 'created_by',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'updated_by',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'deleted_by',
        type: 'varchar',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('product', [
      'is_prime',
      'is_return_guarantee',
      'created_by',
      'updated_by',
      'deleted_by',
    ])
  }
}
