import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class FavoriteMigration1671110365623 implements MigrationInterface {
  name = 'FavoriteMigration1671110365623'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE store_favorite
DROP COLUMN IF EXISTS tmp_user_id;`)
    await queryRunner.query(`ALTER TABLE store_favorite
DROP COLUMN IF EXISTS id;`)
    await queryRunner.query(
      `ALTER TABLE store_favorite ALTER COLUMN user_id DROP NOT NULL;`,
    )
    await queryRunner.query(
      `ALTER TABLE store_favorite ALTER COLUMN store_id DROP NOT NULL;`,
    )
    await queryRunner.createPrimaryKey('store_favorite', [
      'user_id',
      'store_id',
    ])

    await queryRunner.addColumns('store_favorite', [
      new TableColumn({
        name: 'created_at',
        type: 'timestamptz',
        isNullable: false,
        default: 'now()',
      }),
      new TableColumn({
        name: 'updated_at',
        type: 'timestamptz',
        isNullable: false,
        default: 'now()',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropPrimaryKey('store_favorite')
    await queryRunner.dropColumns('store_favorite', [
      'created_at',
      'updated_at',
    ])
  }
}
