import { BaseEntity } from '@medusajs/medusa'
import { Entity as MedusaEntity } from 'medusa-extender'
import { Column, Entity } from 'typeorm'

@MedusaEntity()
@Entity()
export class Postcode extends BaseEntity {
  @Column({ nullable: false })
  pref_id: string

  @Column({ nullable: false })
  pref_name: string

  @Column({ nullable: false })
  addr_1: string

  @Column({ nullable: true })
  addr_2: string

  @Column({ nullable: true, type: 'boolean', default: false })
  is_office: boolean

  @Column({ nullable: true })
  office_name: string

  @Column({ nullable: true })
  office_name_kana: string

  @Column({ nullable: true })
  office_addr: string

  @Column({ nullable: true })
  office_cd: string
}
/**
 * @schema Postcode
 * title: "Postcode"
 * description: "The list of prefectures in Japan"
 * x-resourceId: Postcode
 * required:
 *   - id
 *   - pref_id
 *   - pref_name
 *   - addr_1
 * properties:
 *   id:
 *     description: "The post-code with format xxx-yyyy"
 *     type: string
 *     example: 064-0941
 *   pref_id:
 *     description: "The id of the prefecture"
 *     type: string
 *     example: 26京都府
 *   pref_name:
 *     description: "The name of the prefecture"
 *     type: string
 *     example: 京都府
 *   addr_1:
 *     type: string
 *     description: "市区町村"
 *     example: 京都市北区
 *   addr_2:
 *     type: string
 *     description: "町域"
 *     example: 出雲路神楽町
 *   is_office:
 *     type: boolean
 *     description: "事業所フラグ"
 *     example: true
 *   office_name:
 *     type: string
 *     description: "事業所名"
 *     example: 北海道　札幌旭丘高等学校
 *   office_name_kana:
 *     type: string
 *     description: "事業所名カナ"
 *     example: ホツカイドウ　サツポロアサヒオカコウトウガツコウ
 *   office_addr:
 *     type: string
 *     description: "事業所住所"
 *     example: 旭ケ丘６丁目５番１８号
 *   office_cd:
 *     type: string
 *     description: "新住所CD"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 */
