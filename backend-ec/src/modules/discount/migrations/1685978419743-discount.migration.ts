import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class DiscountMigration1685978419743 implements MigrationInterface {
  name = 'DiscountMigration1685978419743'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('discount', [
      new TableColumn({
        isGenerated: true,
        generationStrategy: 'increment',
        type: 'bigint',
        name: 'display_id',
        isNullable: false,
      }),
      new TableColumn({
        name: 'released_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('discount', ['released_at', 'display_id'])
  }
}
