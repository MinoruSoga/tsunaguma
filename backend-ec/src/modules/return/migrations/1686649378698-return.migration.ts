import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class ReturnMigration1686649378698 implements MigrationInterface {
  name = 'ReturnMigration1686649378698'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE return_status_enum ADD VALUE IF NOT EXISTS 'deleted'  after 'canceled'`,
    )
  }

  public async down(): Promise<void> {
    return
  }
}
