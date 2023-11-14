import {
  AdminPostProductsProductVariantsReq,
  AdminPostProductsReq,
  ProductStatus,
} from '@medusajs/medusa'
import { ProductVariantPricesCreateReq } from '@medusajs/medusa/dist/types/product-variant'
import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { Validator } from 'medusa-extender'

import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import { GiftCoverEnum } from '../entity/product.entity'

/**
 * @oas [post] /products
 * operationId: "PostProducts"
 * summary: "Create a Product"
 * x-authenticated: true
 * description: "Creates a Product"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/ExtendedAdminPostProductReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             product:
 *               $ref: "#/components/schemas/product"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */

export class ExtendedAdminPostProductSpecsReq {
  @IsString()
  @IsNotEmpty()
  lv1_id: string

  @IsString()
  @IsOptional()
  lv2_id?: string

  @IsString()
  @IsOptional()
  lv2_content?: string

  @IsString()
  @IsOptional()
  lv3_id?: string

  @IsString()
  @IsOptional()
  lv3_content?: string
}

/**
 * @schema ExtendedAdminPostProductSpecsReq
 * title: "ExtendedAdminPostProductSpecsReq"
 * description: "Group of specs for product"
 * x-resourceId: ExtendedAdminPostProductSpecsReq
 * type: object
 * required:
 *   - lv1_id
 * properties:
 *   lv1_id:
 *     description: "項目ID"
 *     type: string
 *   lv2_id:
 *     description: "種類ID"
 *     type: string
 *   lv2_content:
 *     description: "種類名"
 *     type: string
 *   lv3_id:
 *     description: "詳細ID"
 *     type: string
 *   lv3_content:
 *     description: "詳細名"
 *     type: string
 */

export class ExtendedAdminPostProductSizesReq {
  @IsString()
  size_id: string

  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsNotEmpty()
  value: string

  @IsBoolean()
  @IsNotEmpty()
  is_free: boolean
}

/**
 * @schema ExtendedAdminPostProductSizesReq
 * title: "ExtendedAdminPostProductSizesReq"
 * description: "Group of sizes for product"
 * x-resourceId: ExtendedAdminPostProductSizesReq
 * type: object
 * required:
 *   - size_id
 *   - value
 *   - is_free
 * properties:
 *   size_id:
 *     description: "size id"
 *     type: string
 *     example: size_332rdlsalfaaaa
 *   name:
 *     description: "size name when free input"
 *     type: string
 *     example: 長い
 *   value:
 *     description: "size value"
 *     type: string
 *     example: 100
 *   is_free:
 *     description: "is free input field"
 *     type: boolean
 *     example: true
 */

@Validator({ override: ProductVariantPricesCreateReq })
export class ExtendedProductVariantPricesCreateReq extends ProductVariantPricesCreateReq {
  currency_code = JAPANESE_CURRENCY_CODE

  @IsBoolean()
  @IsOptional()
  is_sale?: boolean

  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ValidateIf((o) => o.is_sale && !!o.starts_at)
  starts_at?: Date

  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ValidateIf((o) => o.is_sale && !!o.ends_at)
  ends_at?: Date
}

/**
 * @schema ExtendedProductVariantPricesCreateReq
 * title: "ExtendedProductVariantPricesCreateReq"
 * description: "Group of prices for product variant"
 * x-resourceId: ExtendedProductVariantPricesCreateReq
 * type: object
 * required:
 *   - amount
 * properties:
 *   amount:
 *     description: The amount to charge for the Product Variant.
 *     type: integer
 *     example: 10
 *   is_sale:
 *     description: "sale price flag"
 *     type: boolean
 *     example: false
 *   starts_at:
 *     description: "Sale start datetime"
 *     type: string
 *     format: date-time
 *   ends_at:
 *     description: "Sale end datetime"
 *     type: string
 *     format: date-time
 */

@Validator({ override: AdminPostProductsProductVariantsReq })
export class ExtendedAdminPostProductVariantsReq extends AdminPostProductsProductVariantsReq {
  @IsString()
  @IsOptional()
  id?: string

  @IsInt()
  @IsOptional()
  variant_rank?: number

  @IsString()
  @IsOptional()
  product_id?: string

  @IsString()
  @IsOptional()
  title = ''

  @IsInt()
  inventory_quantity: number

  @IsBoolean()
  manage_inventory: boolean

  @IsString()
  @IsOptional()
  color?: string

  @IsString()
  @IsOptional()
  size?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtendedProductVariantPricesCreateReq)
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateIf((_, val) => !!val)
  prices: ExtendedProductVariantPricesCreateReq[]

  @IsBoolean()
  @IsOptional()
  restocking_responsive?: boolean

  @IsOptional()
  @IsNumber()
  threshold_quantity?: number

  @IsOptional()
  @IsNumber()
  varaint_no?: number
}

/**
 * @schema ExtendedAdminPostProductVariantsReq
 * title: "ExtendedAdminPostProductVariantsReq"
 * description: "Group of specs for product"
 * x-resourceId: ExtendedAdminPostProductVariantsReq
 * type: object
 * required:
 *   - inventory_quantity
 *   - manage_inventory
 *   - prices
 * properties:
 *   id:
 *     description: "The ID of variant"
 *     type: string
 *   variant_rank:
 *     description: "Display order of variant ( from 0 )"
 *     type: number
 *   product_id:
 *     description: "The id of product"
 *     type: string
 *   inventory_quantity:
 *     description: "Inventory Quantity"
 *     type: integer
 *     example: 10
 *   manage_inventory:
 *     description: "false: make after order, true: use inventory_quantity"
 *     type: boolean
 *     example: false
 *   color:
 *     description: "color"
 *     type: string
 *     example: Black
 *   size:
 *     description: "Size"
 *     type: string
 *     example: S
 *   prices:
 *     description: List of prices for variant
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ExtendedProductVariantPricesCreateReq"
 *   varaint_no:
 *     description: "Number of product variants"
 *     type: integer
 *     example: 1
 */

export class ExtendedAdminPostProductGiftCoversReq {
  @IsString()
  @IsOptional()
  thumbnail?: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsInt()
  @Min(0)
  price: number
}
/**
 * @schema ExtendedAdminPostProductGiftCoversReq
 * title: "ExtendedAdminPostProductGiftCoversReq"
 * description: "Group of gift covers for product"
 * x-resourceId: ExtendedAdminPostProductGiftCoversReq
 * type: object
 * required:
 *   - name
 *   - price
 * properties:
 *   thumbnail:
 *     description: "cover image"
 *     type: string
 *     example: /product-thumbnail/addeee.png
 *   name:
 *     description: "name of cover"
 *     type: string
 *     example: Japanese paper
 *   price:
 *     description: "price for cover"
 *     type: number
 *     example: 100
 */

export class ProductShippingOptionReq {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsInt()
  @IsOptional()
  bulk_added_price?: number
}

/**
 * @schema ProductShippingOptionReq
 * title: "ProductShippingOptionReq"
 * description: "Group of shipping options for product"
 * x-resourceId: ProductShippingOptionReq
 * type: object
 * required:
 *   - id
 * properties:
 *   id:
 *     description: "shipping_option id"
 *     type: string
 *   bulk_added_price:
 *     description: "bulk purchase shipping price"
 *     type: integer
 */

@Validator({ override: AdminPostProductsReq })
export class ExtendedAdminPostProductReq extends AdminPostProductsReq {
  @IsObject()
  @IsOptional()
  search_string?: Record<string, unknown>

  @IsString()
  @IsOptional()
  store_id?: string

  @IsString()
  // @IsOptional()
  @ValidateIf((o) => o.status !== ProductStatus.DRAFT)
  type_id?: string

  @IsBoolean()
  is_maker_ship?: boolean

  @IsBoolean()
  is_customizable?: boolean

  @IsString()
  @IsOptional()
  ship_from_id?: string

  @IsEnum(GiftCoverEnum)
  gift_cover: GiftCoverEnum

  @IsString()
  @IsOptional()
  ship_after?: string

  @IsString()
  @IsOptional()
  remarks?: string

  @IsString()
  @IsOptional()
  material_id?: string

  @IsString({ each: true })
  @IsOptional()
  product_colors?: string[]

  @IsString({ each: true })
  @IsOptional()
  product_addons?: string[]

  @IsArray()
  @ValidateNested({ each: true })
  // @IsOptional()
  @ArrayMinSize(1)
  @Type(() => ProductShippingOptionReq)
  @ValidateIf((o) => o.status !== ProductStatus.DRAFT && !o.is_free_shipping)
  shipping_options?: ProductShippingOptionReq[]

  @ValidateNested({ each: true })
  @Type(() => ExtendedAdminPostProductGiftCoversReq)
  product_giftcovers?: ExtendedAdminPostProductGiftCoversReq[]

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => ExtendedAdminPostProductSpecsReq)
  product_specs?: ExtendedAdminPostProductSpecsReq[]

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => ExtendedAdminPostProductSizesReq)
  @IsArray({ each: true })
  @ValidateIf((o) => o.status !== ProductStatus.DRAFT)
  product_sizes?: ExtendedAdminPostProductSizesReq[][]

  @IsString()
  // @IsOptional()
  @ValidateIf(
    (o) => !o.product_sizes?.length && o.status !== ProductStatus.DRAFT,
  )
  sizes_note?: string

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  // @IsOptional()
  @Type(() => ExtendedAdminPostProductVariantsReq)
  @ValidateIf((o) => o.status !== ProductStatus.DRAFT)
  variants?: ExtendedAdminPostProductVariantsReq[]

  @IsNumber()
  @IsOptional()
  margin_rate?: number

  @IsNumber()
  @IsOptional()
  spec_rate?: number

  @IsOptional()
  spec_starts_at?: Date

  @IsOptional()
  spec_ends_at?: Date

  @IsBoolean()
  @IsOptional()
  is_free_shipping?: boolean

  @IsString()
  @IsOptional()
  display_code?: string
}

/**
 * @schema ExtendedAdminPostProductReq
 * title: "ExtendedAdminPostProductReq"
 * description: "Products are a grouping of Product Variants that have common properties such as images and descriptions. Products can have multiple options which define the properties that Product Variants differ by."
 * x-resourceId: ExtendedAdminPostProductReq
 * type: object
 * required:
 *   - title
 * properties:
 *   search_string:
 *     description: "Text to use as meilisearch search terms."
 *     type: object
 *   store_id:
 *     description: "Prime Store ID"
 *     type: string
 *   title:
 *     description: "A title that can be displayed for easy identification of the Product."
 *     type: string
 *     example: Medusa Coffee Mug
 *   description:
 *     description: "A short description of the Product."
 *     type: string
 *     example: Every programmer's best friend.
 *   status:
 *     description: The status of the product
 *     type: string
 *     enum:
 *       - draft
 *       - proposed
 *       - published
 *       - rejected
 *     default: draft
 *   images:
 *     description: Images of the Product.
 *     type: object
 *     items:
 *       type: string
 *   variants:
 *     description: The Product Variants that belong to the Product. Each will have a unique combination of Product Option Values.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ExtendedAdminPostProductVariantsReq"
 *   type_id:
 *     type: string
 *     description: The Product type that the Product belongs to
 *     example: ptyp_01G8X9A7ESKAJXG2H0E6F1MW7A
 *   tags:
 *     description: The Product Tags assigned to the Product.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ExtendedAdminPostProductTagsReq"
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 *   is_maker_ship:
 *     type: boolean
 *     example: true
 *   is_customizable:
 *     type: boolean
 *     example: true
 *   ship_from_id:
 *     type: string
 *     description: Location where product is shipped from
 *     example: pref_02G8X9A7ESKAJXG2H0E6F2MW7A
 *   gift_cover:
 *    $ref: "#/components/schemas/GiftCoverEnum"
 *   product_giftcovers:
 *     description: The gift covers
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ExtendedAdminPostProductGiftCoversReq"
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
 *   product_specs:
 *     description: The Product Specs assigned to the Product.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ExtendedAdminPostProductSpecsReq"
 *   product_sizes:
 *     description: The Product Sizes assigned to the Product.
 *     type: array
 *     items:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/ExtendedAdminPostProductSizesReq"
 *   sizes_note:
 *     description: The description for product_sizes
 *     type: string
 *   product_addons:
 *     description: The Addons assigned to the Product.
 *     type: array
 *     items:
 *       type: string
 *   product_colors:
 *     description: The Colors assigned to the Product.
 *     type: array
 *     items:
 *       type: string
 *   shipping_options:
 *     description: The Shipping Options assigned to the Product.
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/ProductShippingOptionReq"
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
 *   is_free_shipping:
 *     type: boolean
 *     description: "Product is free ship or not"
 *   display_code:
 *     type: string
 */

/**
 * @schema ExtendedAdminPostProductTagsReq
 * title: "ExtendedAdminPostProductTagsReq"
 * description: "Group of tags (keywords) for product"
 * x-resourceId: ExtendedAdminPostProductTagsReq
 * type: object
 * required:
 *   - value
 * properties:
 *   id:
 *     description: "The ID of an existing Tag."
 *     type: string
 *   value:
 *     description: "The value of the Tag, these will be upserted."
 *     type: string
 */
