import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class OrderMigration1671165925071 implements MigrationInterface {
  name = 'OrderMigration1671165925071'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('order', [
      new TableColumn({
        name: 'shipped_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('order', ['shipped_at'])
  }
}
