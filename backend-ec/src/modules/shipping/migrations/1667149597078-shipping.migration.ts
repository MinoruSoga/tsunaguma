import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class ShippingMigration1667149597078 implements MigrationInterface {
  name = 'ShippingMigration1667149597078'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('shipping_profile', [
      new TableColumn({
        name: 'store_id',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKeys('shipping_profile', [
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])

    await queryRunner.addColumns('shipping_option', [
      new TableColumn({
        name: 'store_id',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'provider_name',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'size_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'size_name',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_docs',
        type: 'bool',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKeys('shipping_option', [
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])

    await queryRunner.addColumns('fulfillment_provider', [
      new TableColumn({
        name: 'store_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'name',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_free',
        type: 'bool',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_trackable',
        type: 'bool',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_warranty',
        type: 'bool',
        isNullable: true,
      }),
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKeys('fulfillment_provider', [
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('shipping_profile', ['store_id'])

    await queryRunner.dropColumns('shipping_option', [
      'store_id',
      'name',
      'is_free',
      'is_trackable',
      'is_warranty',
      'metadata',
    ])

    await queryRunner.dropColumns('fulfillment_provider', [
      'store_id',
      'provider_name',
      'size_id',
      'size_name',
      'is_docs',
    ])
  }
}
