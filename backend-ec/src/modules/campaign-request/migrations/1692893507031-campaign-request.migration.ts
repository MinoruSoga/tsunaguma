import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

import {
  CampaignRequestStatus,
  CampaignRequestType,
} from '../entities/campaign-request.entity'

@Migration()
export class CampaignRequestMigration1692893507031
  implements MigrationInterface
{
  name = 'Campaign-requestMigration1692893507031'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "campaign_request_status_enum" AS ENUM(${Object.values(
        CampaignRequestStatus,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )
    await queryRunner.query(
      `CREATE TYPE "campaign_request_type_enum" AS ENUM(${Object.values(
        CampaignRequestType,
      )
        .map((val) => `'${val}'`)
        .join(',')})`,
    )
    await queryRunner.createTable(
      new Table({
        name: 'campaign_request',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'store_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: Object.values(CampaignRequestStatus),
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: Object.values(CampaignRequestType),
            isNullable: false,
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
            name: 'expired_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            isGenerated: true,
            generationStrategy: 'increment',
            type: 'bigint',
            name: 'display_id',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            name: 'fk_campaign_request_store',
            columnNames: ['store_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            name: 'fk_campaign_request_product',
            columnNames: ['product_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'product',
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
    await queryRunner.dropTable('campaign_request')
  }
}
