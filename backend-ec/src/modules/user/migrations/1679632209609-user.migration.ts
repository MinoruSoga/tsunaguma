import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

import { WithdrawalStatus } from '../entity/withdrawal.entity'
import {
  WithdrawalReason,
  WithdrawalReasonType,
} from '../entity/withdrawnal-reason.entity'

const initialReasons: Pick<WithdrawalReason, 'value' | 'reason_type' | 'id'>[] =
  [
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: 'お支払い方法がないため',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '目的の作品の購入が終わったため',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '使いづらいため',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '楽しくないため',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '作品の販売を辞めたため',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '作品が売れないため',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: 'プランを変更したい',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '取引トラブルがあったため',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '事務局の対応',
      reason_type: WithdrawalReasonType.STANDARD,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '使いづらいため',
      reason_type: WithdrawalReasonType.PREMIUM,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '楽しくないため',
      reason_type: WithdrawalReasonType.PREMIUM,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '作品の販売を辞めたため',
      reason_type: WithdrawalReasonType.PREMIUM,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '作品が売れないため',
      reason_type: WithdrawalReasonType.PREMIUM,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: 'プランを変更したい',
      reason_type: WithdrawalReasonType.PREMIUM,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '取引トラブルがあったため',
      reason_type: WithdrawalReasonType.PREMIUM,
    },
    {
      id: generateEntityId('', 'withdrawal_reason'),
      value: '事務局の対応',
      reason_type: WithdrawalReasonType.PREMIUM,
    },
  ]

@Migration()
export class UserMigration1679632209609 implements MigrationInterface {
  name = 'UserMigration1679632209609'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "withdrawal_status_enum" AS ENUM(${Object.values(
        WithdrawalStatus,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )
    await queryRunner.query(
      `CREATE TYPE "withdrawal_reason_type_enum" AS ENUM(${Object.values(
        WithdrawalReasonType,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )

    await queryRunner.createTable(
      new Table({
        name: 'withdrawal_reason',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'varchar',
          },
          {
            name: 'value',
            isNullable: false,
            type: 'varchar',
          },
          {
            name: 'reason_type',
            type: 'enum',
            enum: Object.values(WithdrawalReasonType),
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'withdrawal',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'varchar',
          },
          {
            name: 'user_id',
            isNullable: false,
            type: 'varchar',
          },
          {
            name: 'store_id',
            isNullable: true,
            type: 'varchar',
          },
          {
            name: 'note',
            isNullable: true,
            type: 'text',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(WithdrawalStatus),
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_withdrawal_user',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_withdrawal_store',
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
    )

    await queryRunner.createTable(
      new Table({
        name: 'user_withdrawal_reason',
        columns: [
          {
            name: 'id',
            isPrimary: true,
            type: 'varchar',
          },
          {
            name: 'withdrawal_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'withdrawal_reason_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_user_withdrawal_reason_withdrawal',
            columnNames: ['withdrawal_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'withdrawal',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_user_withdrawal_reason_reason',
            columnNames: ['withdrawal_reason_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'withdrawal_reason',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
      true,
    )

    // populate data
    for (const reason of initialReasons) {
      await queryRunner.query(
        `INSERT INTO public.withdrawal_reason (id, value, reason_type) VALUES ($1, $2, $3)`,
        [reason.id, reason.value, reason.reason_type],
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('withdrawal')
    await queryRunner.dropTable('withdrawal_reason')
    await queryRunner.dropTable('user_withdrawal_reason')
    await queryRunner.query('DROP TYPE "withdrawal_status_enum"')
    await queryRunner.query('DROP TYPE "withdrawal_reason_type_enum"')
  }
}
