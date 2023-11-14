import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

const reactionTypes = ['favorite', 'like']

@Migration()
export class ProductMigration1667157190784 implements MigrationInterface {
  name = 'ProductMigration1667157190784'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // favorite & like
    await queryRunner.query(
      `CREATE TYPE "product_reaction_type_enum" AS ENUM(${reactionTypes
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.createTable(
      new Table({
        name: 'product_reaction',
        columns: [
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            isNullable: false,
            enum: reactionTypes,
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

    await queryRunner.createPrimaryKey('product_reaction', [
      'product_id',
      'user_id',
      'type',
    ])

    // review
    await queryRunner.createTable(
      new Table({
        name: 'product_reviews',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'variant_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'order_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'rate',
            type: 'int2',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reply_cnt',
            type: 'int2',
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
            columnNames: ['product_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['variant_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_variant',
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
          {
            columnNames: ['order_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'order',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['parent_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product_reviews',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // review
    await queryRunner.dropTable('product_reviews', true)

    // favorite & like
    await queryRunner.dropTable('product_reaction')

    await queryRunner.query('DROP TYPE "product_reaction_type_enum"')
  }
}
