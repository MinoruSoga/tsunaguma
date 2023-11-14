import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class PointMigration1676553534249 implements MigrationInterface {
  name = 'PointMigration1676553534249'

  // add left amount field to user_history table

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_point_history',
      new TableColumn({ type: 'integer', name: 'left_amount', default: 0 }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_point_history', 'left_amount')
  }
}
