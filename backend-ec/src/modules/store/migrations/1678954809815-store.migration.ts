import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class StoreMigration1678954809815 implements MigrationInterface {
  name = 'StoreMigration1678954809815'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE store_status_enum ADD VALUE IF NOT EXISTS 'stopped'  after 'banned' `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return
  }
}
