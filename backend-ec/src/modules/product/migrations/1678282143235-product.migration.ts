import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class ProductMigration1678282143235 implements MigrationInterface {
  name = 'ProductMigration1678282143235'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.restock_request ALTER COLUMN content DROP NOT NULL;`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.restock_request ALTER COLUMN content SET NOT NULL;`,
    )
  }
}
