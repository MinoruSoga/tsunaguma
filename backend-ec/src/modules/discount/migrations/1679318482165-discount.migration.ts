import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class DiscountMigration1679318482165 implements MigrationInterface {
  name = 'DiscountMigration1679318482165'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user_discount', [
      new TableColumn({
        name: 'created_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        default: 'now()',
      }),
      new TableColumn({
        name: 'updated_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        default: 'now()',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('user_discount', ['created_at', 'updated_at'])
  }
}
