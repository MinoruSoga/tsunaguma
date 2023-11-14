import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

import { StoreStatus } from '../entity/store.entity'

@Migration()
export class StoreMigration1667188798244 implements MigrationInterface {
  name = 'StoreMigration1667188798244'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('store', [
      new TableColumn({
        name: 'free_ship_amount',
        type: 'int',
        isNullable: true,
        default: 0,
      }),
      new TableColumn({
        name: 'opt_return_status',
        type: 'enum',
        isNullable: true,
        enum: Object.values(StoreStatus),
        comment: '返品保証サービス',
      }),
      new TableColumn({
        name: 'opt_photo_status',
        type: 'enum',
        isNullable: true,
        enum: Object.values(StoreStatus),
        comment: '撮影サービス',
      }),
      new TableColumn({
        name: 'opt_hold_status',
        type: 'enum',
        isNullable: true,
        enum: Object.values(StoreStatus),
        comment: '在庫保管サービス',
      }),
      new TableColumn({
        name: 'business_verified_status',
        type: 'enum',
        isNullable: true,
        enum: Object.values(StoreStatus),
        comment: '事業者確認申請',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('store', [
      'free_ship_amount',
      'opt_return_status',
      'opt_photo_status',
      'opt_hold_status',
      'business_verified_status',
    ])
  }
}
