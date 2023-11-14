import {
  ShippingOption as MedusaShippingOption,
  ShippingOptionPriceType,
} from '@medusajs/medusa/dist'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { Entity as MedusaEntity } from 'medusa-extender'
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

import { EAST_ASIA_REGION_ID } from '../../../helpers/constant'
import { Store } from './../../store/entity/store.entity'

export enum ShippingOptionStatusEnum {
  ACTIVE = 'active',
  DELETED = 'deleted',
}
/**
 * @schema ShippingOptionStatusEnum
 * title: "ShippingOptionStatusEnum"
 * description: "The list of status of the shipping options"
 * x-resourceId: ShippingOptionStatusEnum
 * type: string
 * enum:
 *   - active
 *   - deleted
 */

@MedusaEntity({ override: MedusaShippingOption })
@Entity()
export class ShippingOption extends MedusaShippingOption {
  @Column({ nullable: true })
  store_id: string

  @ManyToOne(() => Store, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  // for free-input
  @Column({ nullable: true })
  provider_name: string

  //fulfillment_provider.metadata.sizes.id
  @Column({ nullable: true })
  size_id: string

  // for free-input
  @Column({ nullable: true })
  size_name: string

  @Column({ nullable: true, type: 'bool', default: false })
  is_docs: boolean

  @Column({ nullable: true, type: 'bool', default: false })
  is_trackable: boolean

  @Column({ nullable: true, type: 'bool', default: false })
  is_warranty: boolean

  used_cnt = 0

  @Column({
    type: 'varchar',
    nullable: false,
    enum: ShippingOptionStatusEnum,
    default: ShippingOptionStatusEnum.ACTIVE,
  })
  status: string

  @BeforeInsert()
  private beforeInsertDefaultVals(): void {
    this.id = generateEntityId(this.id, 'so')
    if (!this.price_type) {
      this.price_type = ShippingOptionPriceType.CALCULATED
    }

    // currently set default region to Japan
    if (!this.region_id) {
      this.region_id = EAST_ASIA_REGION_ID
    }

    if (!this.status) {
      this.status = ShippingOptionStatusEnum.ACTIVE
    }

    if (!this.amount) this.amount = 0
  }
}

/**
 * @schema shipping_option
 * title: "Shipping Option"
 * description: "Shipping Options represent a way in which an Order or Return can be shipped. Shipping Options have an associated Fulfillment Provider that will be used when the fulfillment of an Order is initiated. Shipping Options themselves cannot be added to Carts, but serve as a template for Shipping Methods. This distinction makes it possible to customize individual Shipping Methods with additional information."
 * x-resourceId: shipping_option
 * required:
 *   - name
 *   - region_id
 *   - profile_id
 *   - provider_id
 *   - price_type
 * properties:
 *   id:
 *     type: string
 *     description: The shipping option's ID
 *     example: so_01G1G5V27GYX4QXNARRQCW1N8T
 *   name:
 *     description: "The name given to the Shipping Option - this may be displayed to the Customer."
 *     type: string
 *     example: PostFake Standard
 *   region_id:
 *     type: string
 *     description: The region's ID
 *     example: reg_01G1G5V26T9H8Y0M4JNE3YGA4G
 *   region:
 *     description: A region object. Available if the relation `region` is expanded.
 *     type: object
 *   profile_id:
 *     description: "The ID of the Shipping Profile that the shipping option belongs to. Shipping Profiles have a set of defined Shipping Options that can be used to Fulfill a given set of Products."
 *     type: string
 *     example: sp_01G1G5V239ENSZ5MV4JAR737BM
 *   profile:
 *     description: Available if the relation `profile` is expanded.
 *     $ref: "#/components/schemas/shipping_profile"
 *   provider_id:
 *     description: "The id of the Fulfillment Provider, that will be used to process Fulfillments from the Shipping Option."
 *     type: string
 *     example: manual
 *   provider:
 *     description: Available if the relation `provider` is expanded.
 *     $ref: "#/components/schemas/fulfillment_provider"
 *   price_type:
 *     description: "The type of pricing calculation that is used when creatin Shipping Methods from the Shipping Option. Can be `flat_rate` for fixed prices or `calculated` if the Fulfillment Provider can provide price calulations."
 *     type: string
 *     enum:
 *       - flat_rate
 *       - calculated
 *     example: flat_rate
 *   amount:
 *     description: "The amount to charge for shipping when the Shipping Option price type is `flat_rate`."
 *     type: integer
 *     example: 200
 *   is_return:
 *     description: "Flag to indicate if the Shipping Option can be used for Return shipments."
 *     type: boolean
 *     default: false
 *   requirements:
 *     description: The requirements that must be satisfied for the Shipping Option to be available for a Cart. Available if the relation `requirements` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/shipping_option_requirement"
 *   data:
 *     description: "The data needed for the Fulfillment Provider to identify the Shipping Option."
 *     type: object
 *     example: {}
 *   includes_tax:
 *     description: "[EXPERIMENTAL] Does the shipping option price include tax"
 *     type: boolean
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   deleted_at:
 *     type: string
 *     description: "The date with timezone at which the resource was deleted."
 *     format: date-time
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 *   store_id:
 *     type: string
 *     description: "The store id which reference to shipping option."
 *     example: store_12345
 *   store:
 *     type: object
 *     description: "The store which reference to shipping option."
 *     $ref: "#/components/schemas/store"
 *   provider_name:
 *     type: string
 *     description: "Fulfillment provider name for free input."
 *   size_id:
 *     type: string
 *     description: "The fulfillment provider size id"
 *   size_name:
 *     type: string
 *     description: "The fulfillment provider size name"
 *   is_docs:
 *     type: boolean
 *     description: "Documentation option"
 *   is_trackable:
 *     type: boolean
 *   is_warranty:
 *     type: boolean
 *   used_cnt:
 *     type: number
 *   status:
 *     $ref: "#/components/schemas/ShippingOptionStatusEnum"
 */
