import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class ShippingMigration1669782224924 implements MigrationInterface {
  name = 'ShippingMigration1669782224924'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE shipping_option ALTER COLUMN is_docs SET DEFAULT false;`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE shipping_option ALTER COLUMN is_docs DROP DEFAULT;`,
    )
  }
}
