import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class CampaignRequestMigration1693189390155
  implements MigrationInterface
{
  name = 'Campaign-requestMigration1693189390155'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('campaign_request', [
      new TableColumn({
        name: 'approved_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('campaign_request', 'approved_at')
  }
}
