import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class DiscountMigration1686025894653 implements MigrationInterface {
  name = 'DiscountMigration1686025894653'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const query =
      "UPDATE public.discount d SET released_at = updated_at FROM (select id from discount where status = 'published') AS del WHERE d.id=del.id "
    await queryRunner.query(query)
  }

  public async down(): Promise<void> {
    return
  }
}
