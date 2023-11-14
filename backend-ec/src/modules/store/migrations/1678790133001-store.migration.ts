import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class StoreMigration1678790133001 implements MigrationInterface {
  name = 'StoreMigration1678790133001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE public.store SET is_return_guarantee = false, has_photo_service = false, photo_service_type = null WHERE plan_type = 'standard'`,
    )

    await queryRunner.query(
      `UPDATE public.store SET is_return_guarantee = true, has_photo_service = true, photo_service_type = 'basic' WHERE plan_type = 'prime'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return
  }
}
