import { BatchJobService } from '@medusajs/medusa'
import {
  AllocationType,
  BatchJob,
  DiscountConditionOperator,
  DiscountRuleType,
} from '@medusajs/medusa/dist/models'
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
  ValidateNested,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { ExactlyOne } from '../../../helpers/exactly-one'
import { IsGreaterThan } from '../../../helpers/greater-than'
import { IsISO8601Duration } from '../../../helpers/iso8601-duration'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { defaultAdminDiscountsRelations } from '../discount.router'
import {
  Discount,
  DiscountStatus,
  DiscountType,
  IssuanceTimingEnum,
  StoreApplyEnum,
} from '../entities/discount.entity'
import { DiscountService } from '../services/discount.service'
import { UpsertDiscountConditionInput } from '../services/discount-condition.service'
import { DiscountHistoryService } from '../services/discount-history.service'
import { StoreGroupService } from '../services/store-group.service'

/**
 * @oas [put] /discounts/{id}
 * operationId: "PutDiscountsDiscount"
 * summary: "Update a Discount"
 * description: "Updates a Discount with a given set of rules that define how the Discount behaves."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Discount.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminPutDiscountReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Discount
 * responses:
 *   200:
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
  const id = req.params.id
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const validated = await validator(AdminPutDiscountReq, req.body)

  const batchJobService: BatchJobService = req.scope.resolve('batchJobService')
  const discountService: DiscountService = req.scope.resolve('discountService')
  const discountHistoryService: DiscountHistoryService = req.scope.resolve(
    'discountHistoryService',
  )

  if (!validated.status) {
    validated.status = DiscountStatus.PUBLISHED
  }

  const storeGroupService: StoreGroupService =
    req.scope.resolve('storeGroupService')

  const { store_owner_id, ...rest } = validated

  let stores = []
  if (validated.store_owner_id) {
    stores = await storeGroupService.getStores(store_owner_id)
  }

  let batchJob: BatchJob

  const manager: EntityManager = req.scope.resolve('manager')
  await manager.transaction(async (transactionManager) => {
    await discountHistoryService.create(id, loggedInUser.id)
    return await discountService
      .withTransaction(transactionManager)
      .update_(id, rest)
  })

  const data = (await discountService.retrieve(id, {
    relations: defaultAdminDiscountsRelations.concat([
      'rule.conditions.customer_groups',
      'rule.conditions.store_groups',
      'rule.conditions.products',
    ]),
  })) as Discount

  if (stores?.length) {
    const conditions: UpsertDiscountConditionInput[] = []
    if (data.rule.conditions?.length) {
      const store_groups = data.rule.conditions.find(
        (e) => e.store_groups?.length > 0,
      )

      if (store_groups) {
        const sgs = store_groups['store_groups'].map((e) => e.id)
        conditions.push({
          operator: DiscountConditionOperator.IN,
          store_groups: sgs,
        })
      }

      const products = data.rule.conditions.find((e) => e.products?.length > 0)

      if (products) {
        const ids = products['products'].map((e) => e.id)
        conditions.push({
          operator: DiscountConditionOperator.IN,
          products: ids,
        })
      }

      const product_types = data.rule.conditions.find(
        (e) => e.product_types?.length > 0,
      )

      if (product_types) {
        const ids = product_types['product_types'].map((e) => e.id)
        conditions.push({
          operator: DiscountConditionOperator.IN,
          product_types: ids,
        })
      }

      const customer_groups = data.rule.conditions.find(
        (e) => e.customer_groups?.length > 0,
      )

      if (customer_groups) {
        const cgs = customer_groups['customer_groups'].map((e) => e.id)
        conditions.push({
          operator: DiscountConditionOperator.IN,
          customer_groups: cgs,
        })
      }
    }

    const toCreate = {
      is_dynamic: data.is_dynamic,
      is_disabled: data.is_disabled,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      usage_limit: data.usage_limit,
      is_sale: data.is_sale,
      terms_of_use: data.terms_of_use,
      payback_rate: data.payback_rate,
      store_apply: data.store_apply,
      issuance_timing: data.issuance_timing,
      amount_limit: data.amount_limit,
      status: data.status,
      type: data.type,
      rule: {
        description: data.rule.description,
        type: data.rule.type,
        value: data.rule.value,
        allocation: data.rule.allocation,
        conditions: conditions,
      },
      title: data.title,
    }

    const manager: EntityManager = req.scope.resolve('manager')
    const create_discount = {
      type: 'create-discount',
      context: {
        storeTargetGroup: store_owner_id,
        body: toCreate,
        discountId: id,
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

  res.status(200).json({ batch_job: batchJob })
}

/**
 * @schema AdminPutDiscountReq
 * title: "AdminPutDiscountReq"
 * description: "Update Discount Condition"
 * x-resourceId: AdminPutDiscountReq
 * type: object
 * properties:
 *   rule:
 *     description: The Discount Rule that defines how Discounts are calculated
 *     type: object
 *     required:
 *       - id
 *     properties:
 *       id:
 *         type: string
 *         description: "The ID of the Rule"
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
 *         description: "A set of conditions that can be used to limit when the discount can be used. Only one of `products`, `product_types`, `product_collections`, `product_tags`, and `customer_groups` should be provided."
 *         items:
 *           type: object
 *           required:
 *             - operator
 *           properties:
 *             id:
 *               type: string
 *               description: "The ID of the Rule"
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
 *   is_disabled:
 *     type: boolean
 *     description: Whether the Discount code is disabled on creation. You will have to enable it later to make it available to Customers.
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
 *   usage_limit:
 *     type: number
 *     description: Maximum times the discount can be used
 *   regions:
 *     description: A list of Region ids representing the Regions in which the Discount can be used.
 *     type: array
 *     items:
 *       type: string
 *   metadata:
 *     description: An object containing metadata of the discount
 *     type: object
 *   store_id:
 *     type: string
 *   owner_store_id:
 *     type: string
 *   title:
 *     type: string
 *   thumbnail:
 *     type: string
 *   is_sale:
 *     type: boolean
 *   terms_of_use:
 *     type: string
 *   payback_rate:
 *     type: number
 *   store_apply:
 *     $ref: "#/components/schemas/StoreApplyEnum"
 *   issuance_timing:
 *     $ref: "#/components/schemas/IssuanceTimingEnum"
 *   amount_limit:
 *     type: number
 *   is_target_user:
 *     type: boolean
 *   status:
 *     $ref: "#/components/schemas/DiscountStatus"
 *   store_owner_id:
 *     type: string
 */

export class AdminUpsertCondition {
  @IsString()
  @IsOptional()
  id?: string

  @IsString()
  @IsOptional()
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

export class AdminUpdateDiscountRule {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @IsOptional()
  value?: number

  @IsOptional()
  @IsEnum(DiscountRuleType, {
    message: `Invalid rule type, must be one of "fixed", "percentage" or "free_shipping"`,
  })
  type?: DiscountRuleType

  @IsOptional()
  @IsEnum(AllocationType, {
    message: `Invalid allocation type, must be one of "total" or "item"`,
  })
  allocation?: AllocationType

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminUpsertCondition)
  conditions?: AdminUpsertCondition[]
}

export class AdminPutDiscountReq {
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUpdateDiscountRule)
  rule?: AdminUpdateDiscountRule

  @IsBoolean()
  @IsOptional()
  is_disabled?: boolean

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  starts_at?: Date

  @IsDate()
  @IsOptional()
  @IsGreaterThan('starts_at')
  @Type(() => Date)
  ends_at?: Date | null

  @IsISO8601Duration()
  @IsOptional()
  valid_duration?: string | null

  @IsNumber()
  @IsOptional()
  @IsPositive()
  usage_limit?: number | null

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  regions?: string[]

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

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
  @IsEnum(DiscountType, {
    always: true,
    message: `Invalid value (type must be one of following values: ${Object.values(
      DiscountType,
    ).join(', ')})`,
  })
  type?: DiscountType

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
