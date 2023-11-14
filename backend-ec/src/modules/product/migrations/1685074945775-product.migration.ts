import { Migration } from 'medusa-extender'
import { MigrationInterface, QueryRunner } from 'typeorm'

@Migration()
export class ProductMigration1685074945775 implements MigrationInterface {
  name = 'ProductMigration1685074945775'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const countLike =
      'UPDATE product SET like_cnt = fav.total FROM (select product_id, count(*) as total from public.product_favorite pf group by product_id) AS fav WHERE product.id=fav.product_id'
    const resetLike =
      'UPDATE product SET like_cnt = 0 FROM (select id from public.product where like_cnt < 0 ) AS tmp WHERE product.id=tmp.id'

    await queryRunner.query(countLike)
    await queryRunner.query(resetLike)
  }

  public async down(): Promise<void> {
    return
  }
}
