import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

import { GiftCoverEnum } from '../entity/product.entity'

@Migration()
export class ProductMigration1667150651362 implements MigrationInterface {
  name = 'ProductMigration1667150651362'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "product_gift_cover_enum" AS ENUM(${Object.values(
        GiftCoverEnum,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )
    // image
    await queryRunner.addColumns('product_images', [
      new TableColumn({
        type: 'int',
        name: 'rank',
        isNullable: true,
      }),
    ])
    await queryRunner.addColumns('image', [
      new TableColumn({
        isNullable: false,
        name: 'store_id',
        type: 'varchar',
      }),
    ])
    await queryRunner.createForeignKeys('image', [
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])

    // specs
    await queryRunner.createTable(
      new Table({
        name: 'product_spec',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_free',
            type: 'bool',
            isNullable: false,
            default: false,
          },
          {
            name: 'product_type_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['product_type_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_type',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['parent_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_spec',
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
        name: 'product_specs',
        columns: [
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'lv1_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'lv2_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lv2_content',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lv3_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lv3_content',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'rank',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
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
            columnNames: ['lv1_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_spec',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['lv2_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_spec',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['lv3_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_spec',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
    await queryRunner.createPrimaryKey('product_specs', [
      'product_id',
      'lv1_id',
      'lv2_id',
      'lv3_id',
    ])

    // size
    await queryRunner.createTable(
      new Table({
        name: 'product_size',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_free',
            type: 'bool',
            isNullable: false,
            default: false,
          },
          {
            name: 'product_type_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'unit',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'desc',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['product_type_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_type',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    // category - type
    await queryRunner.addColumns('product_type', [
      new TableColumn({
        name: 'parent_id',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKey(
      'product_type',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product_type',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )

    // addon
    await queryRunner.createTable(
      new Table({
        name: 'product_addons',
        columns: [
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'lv1_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'lv2_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'rank',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
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
            columnNames: ['lv1_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_addon',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['lv2_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_addon',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
    await queryRunner.createPrimaryKey('product_addons', [
      'product_id',
      'lv1_id',
      'lv2_id',
    ])

    // material
    await queryRunner.createTable(
      new Table({
        name: 'product_material',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'product_type_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['product_type_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_type',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    // color
    await queryRunner.createTable(
      new Table({
        name: 'product_color',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'product_colors',
        columns: [
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'color_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'rank',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
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
            columnNames: ['color_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_color',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
    await queryRunner.createPrimaryKey('product_colors', [
      'product_id',
      'color_id',
    ])

    // product
    await queryRunner.addColumns('product', [
      new TableColumn({
        name: 'store_id',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'is_maker_ship',
        type: 'bool',
        isNullable: true,
      }),
      new TableColumn({
        name: 'type_lv1_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'type_lv2_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_customizable',
        type: 'bool',
        isNullable: true,
      }),
      new TableColumn({
        name: 'gift_cover',
        type: 'enum',
        isNullable: true,
        enum: Object.values(GiftCoverEnum),
      }),
      new TableColumn({
        name: 'ship_from_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'ship_after',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'remarks',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'material_id',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKeys('product', [
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['type_lv1_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product_type',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['type_lv2_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product_type',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['ship_from_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'prefecture',
      }),
      new TableForeignKey({
        columnNames: ['material_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product_material',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // product
    await queryRunner.dropColumns('product', [
      'store_id',
      'is_maker_ship',
      'type_lv1_id',
      'type_lv2_id',
      'is_customizable',
      'gift_cover',
      'ship_from_id',
      'ship_after',
      'remarks',
      'material_id',
    ])

    // color
    await queryRunner.dropTable('product_color', true)
    await queryRunner.dropTable('product_colors', true)

    // material
    await queryRunner.dropTable('product_material', true)

    // addon
    await queryRunner.dropTable('product_addons', true)

    // category - type
    await queryRunner.dropColumns('product_type', ['parent_id'])

    // size
    await queryRunner.dropTable('product_size', true)

    // specs
    await queryRunner.dropTable('product_spec', true)
    await queryRunner.dropTable('product_specs', true)

    // image
    await queryRunner.dropColumns('product_images', ['rank'])
    await queryRunner.dropColumns('image', ['store_id'])

    await queryRunner.query('DROP TYPE "product_gift_cover_enum"')
  }
}
