import { Product as MedusaProduct } from '@medusajs/medusa/dist'
import { resolveDbGenerationStrategy } from '@medusajs/medusa/dist/utils/db-aware-column'
import { resolveDbType } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'

import { Prefecture } from '../../prefecture/entity/prefecture.entity'
import { Store } from '../../store/entity/store.entity'
import { ProductAddons } from './product-addons.entity'
import { ProductColors } from './product-colors.entity'
import { ProductImages } from './product-images.entity'
import { ProductMaterial } from './product-material.entity'
import { ProductReaction } from './product-reaction.entity'
import { ProductReviews } from './product-reviews.entity'
import { ProductShippingOptions } from './product-shipping-options.entity'
import { ProductSpecs } from './product-specs.entity'
import { ProductType } from './product-type.entity'
import { ProductVariant } from './product-variant.entity'

/**
 * @schema GiftCoverEnum
 * title: "GiftCoverEnum"
 * description: "Gift Cover of Product"
 * x-resourceId: GiftCoverEnum
 * type: string
 * enum:
 *   - none
 *   - free
 *   - pay
 */
export enum GiftCoverEnum {
  NONE = 'none',
  FREE = 'free',
  PAY = 'pay',
}

/**
 * @schema ProductStatusEnum
 * title: "ProductStatusEnum"
 * description: "The list of status of the Product"
 * x-resourceId: ProductStatusEnum
 * type: string
 * enum:
 *   - draft
 *   - proposed
 *   - published
 *   - rejected
 *   - deleted
 *   - delivery_request
 */

export enum ProductStatusEnum {
  draft = 'draft',
  proposed = 'proposed',
  published = 'published',
  rejected = 'rejected',
  deleted = 'deleted',
  delivery_request = 'delivery_request',
}

@MedusaEntity({ override: MedusaProduct })
@Entity()
export class Product extends MedusaProduct {
  @Column({ type: 'json', nullable: true })
  search_string: Record<string, unknown>

  @Index()
  @Column({ nullable: false })
  store_id: string

  @ManyToOne(() => Store, (store) => store.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store: Store

  @Column({ type: 'boolean', nullable: true })
  is_maker_ship: boolean

  @Column({ type: 'varchar', nullable: true })
  type_lv1_id: string | null

  @Column({ type: 'varchar', nullable: true })
  type_lv2_id: string | null

  @ManyToOne(() => ProductType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'type_lv1_id', referencedColumnName: 'id' })
  type_lv1: ProductType

  @ManyToOne(() => ProductType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'type_lv2_id', referencedColumnName: 'id' })
  type_lv2: ProductType

  @Column({ type: 'boolean', nullable: true })
  is_customizable: boolean

  @Column({ type: 'varchar', nullable: true })
  ship_from_id: string

  @ManyToOne(() => Prefecture)
  @JoinColumn({ name: 'ship_from_id', referencedColumnName: 'id' })
  ship_from: Prefecture

  @Column({ type: 'enum', enum: GiftCoverEnum, default: GiftCoverEnum.NONE })
  gift_cover: string

  // Note: profile_id

  @Column({ type: 'varchar', nullable: true })
  ship_after: string

  @Column({ type: 'varchar', nullable: true })
  remarks: string | null

  @Column({ type: 'varchar', nullable: true })
  material_id: string

  @Column({ type: 'integer', default: 0 })
  like_cnt: number

  //margin product
  @Column({ type: 'int', default: 5 })
  margin_rate: number

  @Column({ type: 'int', default: 0 })
  spec_rate: number

  @Column({ type: resolveDbType('timestamptz'), nullable: true })
  spec_starts_at: Date | null

  @Column({ type: resolveDbType('timestamptz'), nullable: true })
  spec_ends_at: Date | null

  @Column({ type: 'boolean', nullable: true })
  is_soldout: boolean

  //price

  @Column({ type: 'int', nullable: true })
  price: number

  @Column({ type: 'int', nullable: true })
  sale_price: number

  @Column({ type: resolveDbType('timestamptz'), nullable: true })
  sale_from: Date | null

  @Column({ type: resolveDbType('timestamptz'), nullable: true })
  sale_to: Date | null

  @ManyToOne(() => ProductMaterial)
  @JoinColumn({ name: 'material_id', referencedColumnName: 'id' })
  product_material: ProductMaterial

  @OneToMany(() => ProductSpecs, (specs) => specs.product)
  product_specs: ProductSpecs[]

  @OneToMany(() => ProductAddons, (productAddons) => productAddons.product)
  product_addons: ProductAddons[]

  @OneToMany(() => ProductColors, (productColor) => productColor.product)
  product_colors: ProductColors[]

  @OneToMany(
    () => ProductShippingOptions,
    (productShippingOptions) => productShippingOptions.product,
  )
  product_shipping_options: ProductShippingOptions[]

  @OneToMany(() => ProductReviews, (productReview) => productReview.product)
  product_reviews: ProductReviews[]

  @OneToMany(
    () => ProductReaction,
    (productReaction) => productReaction.product,
  )
  product_reactions: ProductReaction[]

  @OneToMany(() => ProductImages, (productImage) => productImage.product)
  product_images: ProductImages[]

  stock_quantity: number

  // product_sizes => metadata
  // product_gift_cover => metadata

  @Index()
  @Column()
  @Generated(resolveDbGenerationStrategy('increment'))
  display_id: number

  @Column({ type: 'varchar', nullable: true })
  display_code: string | null

  is_liked?: boolean

  @Column()
  is_free_shipping: boolean

  @Column({ type: 'boolean', nullable: true, default: false })
  is_prime: boolean

  @Column({ type: 'boolean', nullable: true, default: false })
  is_return_guarantee: boolean

  @Column({ type: 'varchar', nullable: true })
  created_by: string

  @Column({ type: 'varchar', nullable: true })
  updated_by: string

  @Column({ type: 'varchar', nullable: true })
  deleted_by: string

  @Column({ type: 'integer', default: 0 })
  shop_rank: number

  @Column({
    type: 'enum',
    enum: ProductStatusEnum,
    nullable: true,
  })
  old_status: Product

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[]

  @Column({ type: resolveDbType('timestamptz'), nullable: true })
  released_at: Date | null
}

/**
 * @schema product
 * title: "Product"
 * description: "Products are a grouping of Product Variants that have common properties such as images and descriptions. Products can have multiple options which define the properties that Product Variants differ by."
 * x-resourceId: product
 * required:
 *   - title
 *   - profile_id
 *   - store_id
 * properties:
 *   id:
 *     type: string
 *     description: The product's ID
 *     example: prod_01G1G5V2MBA328390B5AXJ610F
 *   title:
 *     description: "A title that can be displayed for easy identification of the Product."
 *     type: string
 *     example: Medusa Coffee Mug
 *   subtitle:
 *     description: "An optional subtitle that can be used to further specify the Product."
 *     type: string
 *   description:
 *     description: "A short description of the Product."
 *     type: string
 *     example: Every programmer's best friend.
 *   handle:
 *     description: "A unique identifier for the Product (e.g. for slug structure)."
 *     type: string
 *     example: coffee-mug
 *   is_giftcard:
 *     description: "Whether the Product represents a Gift Card. Products that represent Gift Cards will automatically generate a redeemable Gift Card code once they are purchased."
 *     type: boolean
 *     default: false
 *   status:
 *     description: The status of the product
 *     type: string
 *     enum:
 *       - draft
 *       - proposed
 *       - published
 *       - rejected
 *       - delivery_request
 *       - deleted
 *     default: draft
 *   images:
 *     description: Images of the Product. Available if the relation `images` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/image"
 *   product_images:
 *     description: Images of the Product. Available if the relation `images` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_image"
 *   thumbnail:
 *     description: "A URL to an image file that can be used to identify the Product."
 *     type: string
 *     format: uri
 *   options:
 *     description: The Product Options that are defined for the Product. Product Variants of the Product will have a unique combination of Product Option Values. Available if the relation `options` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_option"
 *   variants:
 *     description: The Product Variants that belong to the Product. Each will have a unique combination of Product Option Values. Available if the relation `variants` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_variant"
 *   profile_id:
 *     description: "The ID of the Shipping Profile that the Product belongs to. Shipping Profiles have a set of defined Shipping Options that can be used to Fulfill a given set of Products."
 *     type: string
 *     example: sp_01G1G5V239ENSZ5MV4JAR737BM
 *   profile:
 *     description: Available if the relation `profile` is expanded.
 *     $ref: "#/components/schemas/shipping_profile"
 *   weight:
 *     description: "The weight of the Product Variant. May be used in shipping rate calculations."
 *     type: number
 *     example: null
 *   height:
 *     description: "The height of the Product Variant. May be used in shipping rate calculations."
 *     type: number
 *     example: null
 *   width:
 *     description: "The width of the Product Variant. May be used in shipping rate calculations."
 *     type: number
 *     example: null
 *   length:
 *     description: "The length of the Product Variant. May be used in shipping rate calculations."
 *     type: number
 *     example: null
 *   hs_code:
 *     description: "The Harmonized System code of the Product Variant. May be used by Fulfillment Providers to pass customs information to shipping carriers."
 *     type: string
 *     example: null
 *   origin_country:
 *     description: "The country in which the Product Variant was produced. May be used by Fulfillment Providers to pass customs information to shipping carriers."
 *     type: string
 *     example: null
 *   mid_code:
 *     description: "The Manufacturers Identification code that identifies the manufacturer of the Product Variant. May be used by Fulfillment Providers to pass customs information to shipping carriers."
 *     type: string
 *     example: null
 *   material:
 *     description: "The material and composition that the Product Variant is made of, May be used by Fulfillment Providers to pass customs information to shipping carriers."
 *     type: string
 *     example: null
 *   collection_id:
 *     type: string
 *     description: The Product Collection that the Product belongs to
 *     example: pcol_01F0YESBFAZ0DV6V831JXWH0BG
 *   collection:
 *     description: A product collection object. Available if the relation `collection` is expanded.
 *     type: object
 *   type_id:
 *     type: string
 *     description: The Product type that the Product belongs to
 *     example: ptyp_01G8X9A7ESKAJXG2H0E6F1MW7A
 *   type:
 *     description: Available if the relation `type` is expanded.
 *     $ref: "#/components/schemas/product_type"
 *   tags:
 *     description: The Product Tags assigned to the Product. Available if the relation `tags` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_tag"
 *   discountable:
 *     description: "Whether the Product can be discounted. Discounts will not apply to Line Items of this Product when this flag is set to `false`."
 *     type: boolean
 *     default: true
 *   external_id:
 *     description: The external ID of the product
 *     type: string
 *     example: null
 *   sales_channels:
 *     description: The sales channels the product is associated with. Available if the relation `sales_channels` is expanded.
 *     type: array
 *     items:
 *       type: object
 *       description: A sales channel object.
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
 *   search_string:
 *     type: object
 *     description: "Search term that meilisearch will lookup to."
 *     example: {value1: "white"}
 *   store_id:
 *     description: "The ID of the store that the Product belongs to."
 *     type: string
 *     example: store_01G1G5V239ENSZ5MV4JAR737BM
 *   store:
 *     description: Available if the relation `store` is expanded.
 *     $ref: "#/components/schemas/store"
 *   is_maker_ship:
 *     type: boolean
 *     example: true
 *   like_cnt:
 *     type: number
 *     example: true
 *   type_lv1_id:
 *     type: string
 *     description: The Product type level 1 that the Product belongs to
 *     example: ptyp_01G8X9A7ESKAJXG2H0E6F1MW7A
 *   type_lv1:
 *     description: Available if the relation `type_lv1_id` is expanded.
 *     $ref: "#/components/schemas/product_type"
 *   type_lv2_id:
 *     type: string
 *     description: The Product type level 2 that the Product belongs to
 *     example: ptyp_02G8X9A7ESKAJXG2H0E6F2MW7A
 *   type_lv2:
 *     description: Available if the relation `type_lv2_id` is expanded.
 *     $ref: "#/components/schemas/product_type"
 *   is_customizable:
 *     type: boolean
 *     example: true
 *   ship_from_id:
 *     type: string
 *     description: Location where product is shipped from
 *     example: pref_02G8X9A7ESKAJXG2H0E6F2MW7A
 *   ship_from:
 *     description: Available if the relation `ship_from_id` is expanded.
 *     $ref: "#/components/schemas/prefecture"
 *   gift_cover:
 *    $ref: "#/components/schemas/GiftCoverEnum"
 *   ship_after:
 *     description: "How long the product will be shipped"
 *     type: string
 *     example: 12
 *   remarks:
 *     description: "Remarks of product"
 *     type: string
 *     example: Abc
 *   material_id:
 *     type: string
 *     description: The id of the material that the Product belongs to
 *     example: material_02G8X9A7ESKAJXG2H0E6F2MW7A
 *   product_material:
 *     description: Available if the relation `material_id` is expanded.
 *     $ref: "#/components/schemas/product_material"
 *   product_specs:
 *     description: The Product Specs assigned to the Product. Available if the relation `product_specs` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_specs"
 *   product_addons:
 *     description: The Addons assigned to the Product. Available if the relation `product_addons` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_addons"
 *   product_colors:
 *     description: The Colors assigned to the Product. Available if the relation `product_colors` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_colors"
 *   product_shipping_options:
 *     description: The Shipping Options assigned to the Product. Available if the relation `product_shipping_options` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_shipping_options"
 *   product_reviews:
 *     description: The Product Reviews of the Product. Available if the relation `product_reviews` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_reviews"
 *   product_reactions:
 *     description: The Reactions of the Product. Available if the relation `product_reactions` is expanded.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/product_reaction"
 *   stock_quantity:
 *     description: "The quantity in stock of the Product."
 *     type: number
 *     example: 0
 *   margin_rate:
 *     description: "Product unit margin rate."
 *     type: number
 *     example: 0
 *   spec_rate:
 *     description: "Product unit special margin rate."
 *     type: number
 *     example: 0
 *   spec_starts_at:
 *     type: string
 *     description: "The Special margin setting period starts."
 *     format: date-time
 *   spec_ends_at:
 *     type: string
 *     description: "The Special margin setting period ends."
 *     format: date-time
 *   display_code:
 *     type: string
 *   display_id:
 *     type: number
 *   is_liked:
 *     description: "Like status"
 *     type: boolean
 *   is_prime:
 *     description: "Prime product"
 *     type: boolean
 *   is_return_guarantee:
 *     description: "has return guarantee"
 *     type: boolean
 *   is_soldout:
 *     description: "Sold-out"
 *     type: boolean
 *   price:
 *     description: "Product unit special margin rate."
 *     type: number
 *     example: 0
 *   sale_price:
 *     description: "Product unit special margin rate."
 *     type: number
 *     example: 0
 *   sale_from:
 *     type: string
 *     description: "The Special margin setting period starts."
 *     format: date-time
 *   sale_to:
 *     type: string
 *     description: "The Special margin setting period starts."
 *     format: date-time
 *   is_free_shipping:
 *     type: boolean
 *     description: The product is free shipped or not
 *   shop_rank:
 *     type: number
 *   released_at:
 *     type: string
 *     description: "The Special margin setting period starts."
 *     format: date-time
 */
