import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class UserMigration1682050868080 implements MigrationInterface {
  name = 'UserMigration1682050868080'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // drop unique index on email (user) and customer (email)
    await queryRunner.query(`           
       DROP INDEX IF EXISTS "IDX_e12875dfb3b1d92d7d7c5377e2";
    `)
    await queryRunner.query(`
       DROP INDEX IF EXISTS "IDX_fdb2f3ad8115da4c7718109a6e";
    `)

    // sync nickname, avatar of customer with user
    await queryRunner.query(`
       UPDATE public.customer c SET nickname = u.nickname, avatar = u.avatar FROM public.user u WHERE u.id = c.id
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email") `,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fdb2f3ad8115da4c7718109a6e" ON "customer" ("email") `,
    )
  }
}
