import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm'

@Migration()
export class FavoriteMigration1668998661513 implements MigrationInterface {
  name = 'FavoriteMigration1668998661513'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_favorite"`)
    await queryRunner.query(`DROP TABLE "store_favorite"`)
    await queryRunner.createTable(
      new Table({
        name: 'product_favorite',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'tmp_user_id',
            type: 'varchar',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['product_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
    await queryRunner.createTable(
      new Table({
        name: 'store_favorite',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'tmp_user_id',
            type: 'varchar',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
    await queryRunner.createPrimaryKey('store_favorite', ['id'])
    await queryRunner.createPrimaryKey('product_favorite', ['id'])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_favorite"`)
    await queryRunner.query(`DROP TABLE "store_favorite"`)
    await queryRunner.createTable(
      new Table({
        name: 'product_favorite',
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['product_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
    await queryRunner.createTable(
      new Table({
        name: 'store_favorite',
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
    await queryRunner.createPrimaryKey('store_favorite', [
      'user_id',
      'store_id',
    ])
    await queryRunner.createPrimaryKey('product_favorite', [
      'user_id',
      'product_id',
    ])
  }
}
