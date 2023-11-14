import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

import {
  EAST_ASIA_REGION_ID,
  JAPANESE_COUNTRY_ISO2,
  JAPANESE_CURRENCY_CODE,
  JAPANESE_TAX_RATE,
} from '../../../helpers/constant'

@Migration()
export class CartMigration1668603596297 implements MigrationInterface {
  name = 'CartMigration1668603596297'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "region" ("id", "name", "currency_code", "tax_rate") VALUES ($1, $2, $3, $4)`,
      [
        EAST_ASIA_REGION_ID,
        'East Asia',
        JAPANESE_CURRENCY_CODE,
        JAPANESE_TAX_RATE,
      ],
    )

    await queryRunner.query(
      `UPDATE "country" SET "region_id" = $1 WHERE "iso_2" = $2`,
      [EAST_ASIA_REGION_ID, JAPANESE_COUNTRY_ISO2],
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const query = ''
    await queryRunner.query(query)
  }
}
