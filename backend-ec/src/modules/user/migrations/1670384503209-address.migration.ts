import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class AddressMigration1670384503209 implements MigrationInterface {
  name = 'AddressMigration1670384503209'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('address', [
      new TableColumn({
        name: 'prefecture_id',
        type: 'varchar',
        isNullable: true,
      }),
    ])

    await queryRunner.createForeignKeys('address', [
      new TableForeignKey({
        columnNames: ['prefecture_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'prefecture',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('address', ['prefecture_id'])
  }
}
