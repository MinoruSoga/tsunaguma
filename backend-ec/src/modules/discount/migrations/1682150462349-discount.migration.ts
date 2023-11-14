import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class DiscountMigration1682150462349 implements MigrationInterface {
  name = 'DiscountMigration1682150462349'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE public.promotion_code_master ALTER COLUMN is_available SET DEFAULT true
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE public.promotion_code_master ALTER COLUMN is_available DROP DEFAULT
        `)
  }
}
