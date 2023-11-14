import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm'

@Migration()
export class ComplainMigration1667445322525 implements MigrationInterface {
  name = 'ComplainMigration1667445322525'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const query = `CREATE TABLE "complain"
                   (
                       "id"         character varying        NOT NULL,
                       "user_id"    character varying        NOT NULL,
                       "product_id" character varying        NOT NULL,
                       "store_id"   character varying        NOT NULL,
                       "reason"     text                     NOT NULL,
                       "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                       "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                       "metadata"   jsonb
                   )`
    await queryRunner.query(query)
    await queryRunner.createPrimaryKey('complain', ['id'])
    await queryRunner.createForeignKey(
      'complain',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )
    await queryRunner.createForeignKey(
      'complain',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )
    await queryRunner.createForeignKey(
      'complain',
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'store',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "complain"')
  }
}
