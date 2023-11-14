import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class StoreMigration1668499045392 implements MigrationInterface {
  name = 'StoreMigration1668499045392'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const query = `ALTER TABLE "store_detail" ALTER COLUMN "deleted_at" TYPE TIMESTAMP WITH TIME ZONE; 
      ALTER TABLE "store_detail" ALTER COLUMN "deleted_at" DROP NOT NULL;
      ALTER TABLE "store_detail" ALTER COLUMN "deleted_at" SET DEFAULT NULL;`
    await queryRunner.query(query)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const query = `ALTER TABLE "store_detail" ALTER COLUMN "deleted_at" TYPE TIMESTAMP WITH TIME ZONE;
      ALTER TABLE "store_detail" ALTER COLUMN "deleted_at" SET NOT NULL;
      ALTER TABLE "store_detail" ALTER COLUMN "deleted_at" SET DEFAULT NULL;`
    await queryRunner.query(query)
  }
}
