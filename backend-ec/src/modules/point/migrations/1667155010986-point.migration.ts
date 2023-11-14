import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm'

@Migration()
export class PointMigration1667155010986 implements MigrationInterface {
  name = 'PointMigration1667155010986'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const queryCreateUserPoint = `CREATE TABLE "user_point"
                                  (
                                      "user_id"    character varying        NOT NULL,
                                      "total"      integer                  NOT NULL,
                                      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                      "metadata"   jsonb
                                  )`
    await queryRunner.query(queryCreateUserPoint)
    await queryRunner.createPrimaryKey('user_point', ['user_id'])
    await queryRunner.createForeignKey(
      'user_point',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )

    const query = `CREATE TABLE "user_point_history"
                   (
                       "id"         character varying        NOT NULL,
                       "user_id"    character varying        NOT NULL,
                       "amount"     integer                  NOT NULL,
                       "expired_at" TIMESTAMP,
                       "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                       "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                       "metadata"   jsonb
                   )`
    await queryRunner.query(query)
    await queryRunner.createPrimaryKey('user_point_history', ['id'])
    await queryRunner.createForeignKey(
      'user_point_history',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "user_point"')
    await queryRunner.query('DROP TABLE "user_point_history"')
  }
}
