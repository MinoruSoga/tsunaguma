import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class ProductMigration1694071307906 implements MigrationInterface {
  name = 'ProductMigration1694071307906'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const query =
      "UPDATE public.product SET released_at= created_at WHERE id IN ( SELECT id FROM public.product p WHERE released_at IS NULL AND status = 'published')"
    await queryRunner.query(query)
  }

  public async down(): Promise<void> {
    return
  }
}
