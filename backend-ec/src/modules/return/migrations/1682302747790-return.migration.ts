import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

@Migration()
export class ReturnMigration1682302747790 implements MigrationInterface {
  name = 'ReturnMigration1682302747790'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('return', [
      new TableColumn({
        isGenerated: true,
        generationStrategy: 'increment',
        type: 'bigint',
        name: 'display_id',
        isNullable: false,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('return', ['display_id'])
  }
}
