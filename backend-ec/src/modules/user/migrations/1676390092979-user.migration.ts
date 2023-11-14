import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class UserMigration1676390092979 implements MigrationInterface {
  name = 'UserMigration1676390092979'

  // restore deleted address but set customer id to null
  // just not belong to any customers
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE public.address SET deleted_at = null, customer_id = null WHERE deleted_at IS NOT null`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return
  }
}
