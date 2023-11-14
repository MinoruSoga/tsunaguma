import {
  AllocationType,
  BatchJob,
  BatchJobService,
  DiscountConditionOperator,
  DiscountRuleType,
} from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { ExactlyOne } from '../../../helpers/exactly-one'
import { IsGreaterThan } from '../../../helpers/greater-than'
import { IsISO8601Duration } from '../../../helpers/iso8601-duration'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import {
  DiscountStatus,
  DiscountType,
  IssuanceTimingEnum,
  StoreApplyEnum,
} from '../entities/discount.entity'
import { DiscountService } from '../services/discount.service'
import { PromotionCodeMasterService } from '../services/promotion-code-master.service'
import { StoreGroupService } from '../services/store-group.service'

/**
 * @oas [post] /discounts
 * operationId: "PostDiscounts"
 * summary: "Creates a Discount"
 * x-authenticated: true
 * description: "Creates a Discount with a given set of rules that define how the Discount behaves."
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCreateDiscountCondition"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Discount
 * responses:
 *   201:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             batch_job:
 *               $ref: "#/components/schemas/batch_job"
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

export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const validated = await validator(ExtendAdminPostDiscountsReq, req.body)

  const loggedInUser = req.scope.resolve('loggedInUser') as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login!')
  }

  const batchJobService: BatchJobService = req.scope.resolve('batchJobService')

  const storeGroupService: StoreGroupService =
    req.scope.resolve('storeGroupService')

  const discountService: DiscountService = req.scope.resolve('discountService')
  const promotionCodeMasterService: PromotionCodeMasterService =
    req.scope.resolve('promotionCodeMasterService')

  let stores = []
  if (validated.store_owner_id) {
    stores = await storeGroupService.getStores(validated.store_owner_id)
  }

  if (!validated.status) {
    validated.status = DiscountStatus.PUBLISHED
  }

  let batchJob: BatchJob

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { store_owner_id, ...rest } = validated

  if (!stores?.length) {
    let code: string

    if (validated.type === DiscountType.PROMO_CODE) {
      const promose_code_master =
        await promotionCodeMasterService.getRandomAvailableCode()
      code = promose_code_master.code
      promotionCodeMasterService.update(promose_code_master.id, {
        is_available: false,
      })
    }

    if (validated.type === DiscountType.COUPON) {
      code = uuid()
    }

    if (validated.type === DiscountType.POINT) {
      code = uuid()
    }

    const manager: EntityManager = req.scope.resolve('manager')

    await manager.transaction(async (transactionManager) => {
      return await discountService
        .withTransaction(transactionManager)
        .create({ ...rest, code })
    })
  } else {
    const manager: EntityManager = req.scope.resolve('manager')
    const create_discount = {
      type: 'create-discount',
      context: {
        storeTargetGroup: store_owner_id,
        body: rest,
      },
      dry_run: false,
    }
    batchJob = await manager.transaction(async (transactionManager) => {
      const toCreate = await batchJobService
        .withTransaction(transactionManager)
        .prepareBatchJobForProcessing(create_discount, req)

      return await batchJobService.withTransaction(transactionManager).create({
        ...toCreate,
        created_by: loggedInUser.id,
      })
    })
  }

  res.status(201).json({ batch_job: batchJob })
}

/**
 * @schema AdminCreateDiscountCondition
 * title: "AdminCreateDiscountCondition"
 * description: "Create Discount Condition"
 * x-resourceId: AdminCreateDiscountCondition
 * type: object
 * required:
 *   - type
 * properties:
 *   is_dynamic:
 *     type: boolean
 *     description: Whether the Discount should have multiple instances of itself, each with a different code. This can be useful for automatically generated codes that all have to follow a common set of rules.
 *     default: false
 *   rule:
 *     description: The Discount Rule that defines how Discounts are calculated
 *     type: object
 *     required:
 *        - type
 *        - value
 *        - allocation
 *     properties:
 *       description:
 *         type: string
 *         description: "A short description of the discount"
 *       type:
 *         type: string
 *         description: "The type of the Discount, can be `fixed` for discounts that reduce the price by a fixed amount, `percentage` for percentage reductions or `free_shipping` for shipping vouchers."
 *         enum: [fixed, percentage, free_shipping]
 *       value:
 *         type: number
 *         description: "The value that the discount represents; this will depend on the type of the discount"
 *       allocation:
 *         type: string
 *         description: "The scope that the discount should apply to."
 *         enum: [total, item]
 *       conditions:
 *         type: array
 *         description: "A set of conditions that can be used to limit when  the discount can be used. Only one of `products`, `product_types`, `product_collections`, `product_tags`, and `customer_groups` should be provided."
 *         items:
 *           type: object
 *           required:
 *              - operator
 *           properties:
 *             operator:
 *               type: string
 *               description: Operator of the condition
 *               enum: [in, not_in]
 *             products:
 *               type: array
 *               description: list of product IDs if the condition is applied on products.
 *               items:
 *                 type: string
 *             product_types:
 *               type: array
 *               description: list of product type IDs if the condition is applied on product types.
 *               items:
 *                 type: string
 *             product_collections:
 *               type: array
 *               description: list of product collection IDs if the condition is applied on product collections.
 *               items:
 *                 type: string
 *             product_tags:
 *               type: array
 *               description: list of product tag IDs if the condition is applied on product tags.
 *               items:
 *                 type: string
 *             customer_groups:
 *               type: array
 *               description: list of customer group IDs if the condition is applied on customer groups.
 *               items:
 *                 type: string
 *             store_groups:
 *               type: array
 *               description: list of store group IDs if the condition is applied on store groups.
 *               items:
 *                 type: string
 *   is_disabled:
 *     type: boolean
 *     description: Whether the Discount code is disabled on creation. You will have to enable it later to make it available to Customers.
 *     default: false
 *   starts_at:
 *     type: string
 *     format: date-time
 *     description: The time at which the Discount should be available.
 *   ends_at:
 *     type: string
 *     format: date-time
 *     description: The time at which the Discount should no longer be available.
 *   valid_duration:
 *     type: string
 *     description: Duration the discount runs between
 *     example: P3Y6M4DT12H30M5S
 *   regions:
 *     description: A list of Region ids representing the Regions in which the Discount can be used.
 *     type: array
 *     items:
 *       type: string
 *   usage_limit:
 *     type: number
 *     description: Maximum times the discount can be used
 *   metadata:
 *     description: An optional set of key-value pairs to hold additional information.
 *     type: object
 *   type:
 *     $ref: "#/components/schemas/DiscountTypeEnum"
 *   thumbnail:
 *     type: string
 *   is_sale:
 *     type: boolean
 *     example: false
 *   terms_of_use:
 *     type: string
 *   payback_rate:
 *     type: integer
 *   store_apply:
 *     type: string
 *     enum:
 *       - csv
 *       - all
 *       - store
 *   issuance_timing:
 *     type: string
 *     enum:
 *       - none
 *       - member_register
 *       - follow
 *       - birth_month
 *       - after_ordering
 *       - reviewed
 *       - favorite
 *   amount_limit:
 *     type: integer
 *   parent_discount_id:
 *     type: string
 *   store_id:
 *     type: string
 *   owner_store_id:
 *     type: string
 *   title:
 *     type: string
 *   is_target_user:
 *     type: boolean
 *   status:
 *     $ref: "#/components/schemas/DiscountStatus"
 *   store_owner_id:
 *     type: string
 */
export class AdminCreateDiscountCondition {
  @IsString()
  operator: DiscountConditionOperator

  @Validate(ExactlyOne, [
    'product_collections',
    'product_types',
    'product_tags',
    'customer_groups',
    'store_groups',
  ])
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  products?: string[]

  @Validate(ExactlyOne, [
    'products',
    'product_types',
    'product_tags',
    'customer_groups',
    'store_groups',
  ])
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  product_collections?: string[]

  @Validate(ExactlyOne, [
    'product_collections',
    'products',
    'product_tags',
    'customer_groups',
    'store_groups',
  ])
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  product_types?: string[]

  @Validate(ExactlyOne, [
    'product_collections',
    'product_types',
    'products',
    'customer_groups',
    'store_groups',
  ])
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  product_tags?: string[]

  @Validate(ExactlyOne, [
    'product_collections',
    'product_types',
    'products',
    'product_tags',
    'store_groups',
  ])
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  customer_groups?: string[]

  @Validate(ExactlyOne, [
    'product_collections',
    'product_types',
    'products',
    'product_tags',
    'customer_groups',
  ])
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  store_groups?: string[]
}
export class AdminPostDiscountsRule {
  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(DiscountRuleType, {
    message: `Invalid rule type, must be one of "fixed", "percentage" or "free_shipping"`,
  })
  type: DiscountRuleType

  @IsNumber()
  value: number

  @IsEnum(AllocationType, {
    message: `Invalid allocation type, must be one of "total" or "item"`,
  })
  allocation: AllocationType

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminCreateDiscountCondition)
  conditions?: AdminCreateDiscountCondition[]
}
export class ExtendAdminPostDiscountsReq {
  @ValidateIf((o) => o.status !== DiscountStatus.DRAFT)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AdminPostDiscountsRule)
  rule: AdminPostDiscountsRule

  @IsBoolean()
  @IsOptional()
  is_dynamic = false

  @IsBoolean()
  @IsOptional()
  is_disabled = false

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  starts_at?: Date

  @IsDate()
  @IsOptional()
  @IsGreaterThan('starts_at')
  @Type(() => Date)
  ends_at?: Date

  @IsISO8601Duration()
  @IsOptional()
  valid_duration?: string

  @IsNumber()
  @IsOptional()
  @IsPositive()
  usage_limit?: number

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  regions?: string[]

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsEnum(DiscountType, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      DiscountType,
    ).join(', ')})`,
  })
  type: DiscountType

  @IsOptional()
  @IsString()
  parent_discount_id?: string

  @IsOptional()
  @IsOptional()
  store_id?: string

  @IsOptional()
  @IsString()
  owner_store_id?: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  thumbnail?: string

  @IsOptional()
  @IsBoolean()
  is_sale?: boolean

  @IsOptional()
  @IsString()
  terms_of_use?: string

  @IsOptional()
  @IsNumber()
  payback_rate?: number

  @IsOptional()
  @IsEnum(StoreApplyEnum, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      StoreApplyEnum,
    ).join(', ')})`,
  })
  store_apply?: StoreApplyEnum

  @IsOptional()
  @IsEnum(IssuanceTimingEnum, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      IssuanceTimingEnum,
    ).join(', ')})`,
  })
  issuance_timing?: IssuanceTimingEnum

  @IsOptional()
  @IsNumber()
  amount_limit?: number

  @IsOptional()
  @IsBoolean()
  is_target_user?: boolean

  @IsOptional()
  @IsEnum(DiscountStatus, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      DiscountStatus,
    ).join(', ')})`,
  })
  status?: DiscountStatus

  @IsOptional()
  @IsString()
  store_owner_id?: string
}
