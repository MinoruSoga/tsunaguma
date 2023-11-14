import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ProductMigration1675767794776 implements MigrationInterface {
  name = 'ProductMigration1675767794776'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('product_reviews', [
      new TableColumn({
        name: 'reply_content',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'reply_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('product_reviews', [
      'reply_content',
      'reply_at',
    ])
  }
}
