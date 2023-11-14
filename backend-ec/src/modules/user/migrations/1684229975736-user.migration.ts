import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class UserMigration1684229975736 implements MigrationInterface {
  name = 'UserMigration1684229975736'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`           
       DROP INDEX IF EXISTS "IDX_ba8de19442d86957a3aa3b5006";
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ba8de19442d86957a3aa3b5006" ON "user" ("email") `,
    )
  }
}
