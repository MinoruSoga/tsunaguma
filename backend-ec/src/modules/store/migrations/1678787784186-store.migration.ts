import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class StoreMigration1678787784186 implements MigrationInterface {
  name = 'StoreMigration1678787784186'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.store RENAME COLUMN return_guarantee TO is_return_guarantee;`,
    )
    await queryRunner.query(
      `ALTER TABLE public.store RENAME COLUMN photo_service TO photo_service_type;`,
    )

    await queryRunner.addColumns('store', [
      new TableColumn({
        name: 'has_photo_service',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'photo_service_note',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'return_guarantee_note',
        type: 'varchar',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('store', [
      'has_photo_service',
      'photo_service_note',
      'return_guarantee_note',
    ])
  }
}
