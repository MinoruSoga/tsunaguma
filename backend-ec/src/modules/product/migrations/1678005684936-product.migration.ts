import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class ProductMigration1678005684936 implements MigrationInterface {
  name = 'ProductMigration1678005684936'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // add new status to existing enum
    await queryRunner.query(
      `ALTER TYPE product_status_enum ADD VALUE IF NOT EXISTS 'deleted'  after 'rejected'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return
  }
}
