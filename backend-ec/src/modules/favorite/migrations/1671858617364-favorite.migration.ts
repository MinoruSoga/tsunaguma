import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class FavoriteMigration1671858617364 implements MigrationInterface {
  name = 'FavoriteMigration1671858617364'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product_favorite', [
      new TableColumn({
        name: 'created_at',
        type: 'timestamptz',
        isNullable: false,
        default: 'now()',
      }),
      new TableColumn({
        name: 'updated_at',
        type: 'timestamptz',
        isNullable: false,
        default: 'now()',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('product_favorite', [
      'created_at',
      'updated_at',
    ])
  }
}
