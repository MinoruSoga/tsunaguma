import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class OrderMigration1668941018901 implements MigrationInterface {
  name = 'OrderMigration1668941018901'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const query =
      'ALTER TABLE public.order ALTER COLUMN store_id DROP NOT NULL;'
    await queryRunner.query(query)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const query = 'ALTER TABLE public.order ALTER COLUMN store_id SET NOT NULL;'
    await queryRunner.query(query)
  }
}
