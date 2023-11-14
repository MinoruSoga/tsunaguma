import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

import {
  StoreBusinessForm,
  StorePlanType,
  StoreStatus,
} from '../entity/store.entity'
import { Gender } from '../entity/store-detail.entity'

@Migration()
export class StoreMigration1666956520885 implements MigrationInterface {
  name = 'StoreMigration1666956520885'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "store_plan_type_enum" AS ENUM(${Object.values(StorePlanType)
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.query(
      `CREATE TYPE "store_business_form_enum" AS ENUM(${Object.values(
        StoreBusinessForm,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.query(
      `CREATE TYPE "store_status_enum" AS ENUM(${Object.values(StoreStatus)
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.query(`
      CREATE TYPE "gender" AS ENUM(${Object.values(Gender)
        .map((val) => `'${val}'`)
        .join(',')})
    `)

    await queryRunner.addColumns('store', [
      new TableColumn({
        name: 'plan_type',
        type: 'enum',
        enum: Object.values(StorePlanType),
      }),
      new TableColumn({
        name: 'business_form',
        type: 'enum',
        enum: Object.values(StoreBusinessForm),
      }),
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: Object.values(StoreStatus),
      }),
      new TableColumn({
        name: 'owner_id',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'slug',
        type: 'varchar',
      }),
      new TableColumn({
        name: 'avatar',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'intro',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'about',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'url',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'store_detail_id',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKeys('store', [
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])

    await queryRunner.createTable(
      new Table({
        name: 'store_detail',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'prefecture_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'post_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'addr_01',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'addr_02',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tel_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mobile_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'emerge_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'gender',
            type: 'enum',
            enum: Object.values(Gender),
          },
          {
            name: 'birthday',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'company_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'company_name_kana',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'firstname',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lastname',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'firstname_kana',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lastname_kana',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contact_firstname',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contact_lastname',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contact_firstname_kana',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contact_lastname_kana',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contact_tel',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'compliance_1',
            type: 'bool',
            isNullable: true,
          },
          {
            name: 'compliance_2',
            type: 'bool',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
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
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['prefecture_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'prefecture',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
      true,
    )

    await queryRunner.createForeignKey(
      'store',
      new TableForeignKey({
        columnNames: ['store_detail_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store_detail',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('store', [
      'plan_type',
      'business_form',
      'status',
      'owner_id',
      'avatar',
      'intro',
      'about',
      'url',
      'store_detail_id',
    ])

    await queryRunner.dropTable('store_detail')

    await queryRunner.query('DROP TYPE "store_status_enum"')
    await queryRunner.query('DROP TYPE "store_business_form_enum"')
    await queryRunner.query('DROP TYPE "store_plan_type_enum"')
    await queryRunner.query('DROP TYPE "gender"')
  }
}
