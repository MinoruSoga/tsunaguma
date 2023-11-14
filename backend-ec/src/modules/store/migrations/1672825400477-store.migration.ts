import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { StorePhotoServiceEnum } from '../entity/store.entity'

@Migration()
export class StoreMigration1672825400477 implements MigrationInterface {
  name = 'StoreMigration1672825400477'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'photo_service',
        type: 'enum',
        enum: Object.values(StorePhotoServiceEnum),
        isNullable: true,
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'photo_service')
  }
}
