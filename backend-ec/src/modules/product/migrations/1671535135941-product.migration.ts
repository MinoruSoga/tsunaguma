import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1671535135941 implements MigrationInterface {
  name = 'ProductMigration1671535135941'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product', [
      new TableColumn({
        name: 'margin_rate',
        type: 'int',
        isNullable: false,
        default: 5,
      }),
      new TableColumn({
        name: 'spec_rate',
        type: 'int',
        isNullable: true,
        default: 0,
      }),
      new TableColumn({
        name: 'spec_starts_at',
        type: 'timestamptz',
        isNullable: true,
      }),
      new TableColumn({
        name: 'spec_ends_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('product', [
      'margin_rate',
      'spec_rate',
      'spec_starts_at',
      'spec_ends_at',
    ])
  }
}
