import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class StoreMigration1677472172363 implements MigrationInterface {
  name = 'StoreMigration1677472172363'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE store_detail_gender_enum ADD VALUE IF NOT EXISTS 'none'  after 'male' `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TYPE "store_detail_gender_enum"')
  }
}
