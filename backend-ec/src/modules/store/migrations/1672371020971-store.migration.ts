import { Migration } from 'medusa-extender'
import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm'

@Migration()
export class StoreMigration1672371020971 implements MigrationInterface {
  name = 'StoreMigration1672371020971'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'store_detail',
      new TableColumn({ name: 'user_id', type: 'varchar', isNullable: true }),
    )
    await queryRunner.createForeignKey(
      'store_detail',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        name: 'fk_store_detail_user',
      }),
    )

    await queryRunner.query(`
       update store_detail as sd 
       set user_id = s.owner_id
       from store as s
       where sd.id = s.store_detail_id
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('store_detail', 'fk_store_detail_user')
    await queryRunner.dropColumn('store_detail', 'user_id')
  }
}
