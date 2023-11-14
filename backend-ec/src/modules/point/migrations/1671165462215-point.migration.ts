import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class PointMigration1671165462215 implements MigrationInterface {
  name = 'PointMigration1671165462215'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user_point_history', [
      new TableColumn({
        name: 'total',
        type: 'integer',
        isNullable: false,
        default: 0,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('user_point_history', ['total'])
  }
}
