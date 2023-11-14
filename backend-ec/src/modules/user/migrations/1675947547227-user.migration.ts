import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class UserMigration1675947547227 implements MigrationInterface {
  name = 'UserMigration1675947547227'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // update email of user and customer to lowercase
    // await queryRunner.query(`UPDATE public.user u SET email = LOWER(u.email)`)
    // await queryRunner.query(
    //   `UPDATE public.customer c SET email = LOWER(c.email)`,
    // )

    // delete user address id if the address is deleted
    await queryRunner.query(
      `UPDATE public.user u SET address_id = NULL FROM public.address a where a.id = u.address_id AND a.deleted_at IS NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return
  }
}
