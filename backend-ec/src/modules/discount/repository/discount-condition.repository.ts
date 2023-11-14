import {
  DiscountConditionCustomerGroup,
  DiscountConditionOperator,
  DiscountConditionProduct,
  DiscountConditionProductCollection,
  DiscountConditionProductTag,
  DiscountConditionProductType,
  DiscountConditionType,
} from '@medusajs/medusa/dist/models'
import { DiscountConditionRepository as MedusaDiscountConditionRepository } from '@medusajs/medusa/dist/repositories/discount-condition'
import { Repository as MedusaRepository, Utils } from 'medusa-extender'
import { DeleteResult, EntityRepository, EntityTarget, In, Not } from 'typeorm'

import { Cart } from '../../cart/entity/cart.entity'
import { LineItem } from '../../cart/entity/line-item.entity'
import { Discount } from '../entities/discount.entity'
import { DiscountCondition } from '../entities/discount-condition.entity'
import { DiscountConditionStoreGroup } from '../entities/discount-condition-store-group.entity'

export enum DiscountConditionJoinTableForeignKey {
  PRODUCT_ID = 'product_id',
  PRODUCT_TYPE_ID = 'product_type_id',
  PRODUCT_COLLECTION_ID = 'product_collection_id',
  PRODUCT_TAG_ID = 'product_tag_id',
  CUSTOMER_GROUP_ID = 'customer_group_id',
  STORE_GROUP_ID = 'store_group_id',
}

export enum DiscountConditionTypeEnum {
  PRODUCTS = 'products',
  PRODUCT_TYPES = 'product_types',
  PRODUCT_COLLECTIONS = 'product_collections',
  PRODUCT_TAGS = 'product_tags',
  CUSTOMER_GROUPS = 'customer_groups',
  STORE_GROUPS = 'store_groups',
}

type DiscountConditionResourceType = EntityTarget<
  | DiscountConditionProduct
  | DiscountConditionProductType
  | DiscountConditionProductCollection
  | DiscountConditionProductTag
  | DiscountConditionCustomerGroup
  | DiscountConditionStoreGroup
>

@MedusaRepository({ override: MedusaDiscountConditionRepository })
@EntityRepository(DiscountCondition)
export class DiscountConditionRepository extends Utils.repositoryMixin<
  DiscountCondition,
  MedusaDiscountConditionRepository
>(MedusaDiscountConditionRepository) {
  async findOneWithDiscount(
    conditionId: string,
    discountId: string,
  ): Promise<(DiscountCondition & { discount: Discount }) | undefined> {
    return (await this.createQueryBuilder('condition')
      .leftJoinAndMapOne(
        'condition.discount',
        Discount,
        'discount',
        `condition.discount_rule_id = discount.rule_id and discount.id = :discId and condition.id = :dcId`,
        { discId: discountId, dcId: conditionId },
      )
      .getOne()) as (DiscountCondition & { discount: Discount }) | undefined
  }

  getJoinTableResourceIdentifierss(type: string): {
    joinTable: string
    resourceKey: string
    joinTableForeignKey: DiscountConditionJoinTableForeignKey
    conditionTable: DiscountConditionResourceType
    joinTableKey: string
  } {
    let conditionTable: DiscountConditionResourceType = DiscountConditionProduct

    let joinTable = 'product'
    let joinTableForeignKey: DiscountConditionJoinTableForeignKey =
      DiscountConditionJoinTableForeignKey.PRODUCT_ID
    let joinTableKey = 'id'

    // On the joined table (e.g. `product`), what key should be match on
    // (e.g `type_id` for product types and `id` for products)
    let resourceKey: string

    switch (type) {
      case DiscountConditionTypeEnum.PRODUCTS: {
        resourceKey = 'id'
        joinTableForeignKey = DiscountConditionJoinTableForeignKey.PRODUCT_ID
        joinTable = 'product'

        conditionTable = DiscountConditionProduct
        break
      }
      case DiscountConditionTypeEnum.PRODUCT_TYPES: {
        joinTableKey = 'id'
        resourceKey = 'type_id'
        joinTableForeignKey =
          DiscountConditionJoinTableForeignKey.PRODUCT_TYPE_ID
        joinTable = 'product'

        conditionTable = DiscountConditionProductType
        break
      }
      case DiscountConditionTypeEnum.PRODUCT_COLLECTIONS: {
        resourceKey = 'collection_id'
        joinTableForeignKey =
          DiscountConditionJoinTableForeignKey.PRODUCT_COLLECTION_ID
        joinTable = 'product'

        conditionTable = DiscountConditionProductCollection
        break
      }
      case DiscountConditionTypeEnum.PRODUCT_TAGS: {
        joinTableKey = 'product_id'
        resourceKey = 'product_tag_id'
        joinTableForeignKey =
          DiscountConditionJoinTableForeignKey.PRODUCT_TAG_ID
        joinTable = 'product_tags'

        conditionTable = DiscountConditionProductTag
        break
      }
      case DiscountConditionTypeEnum.CUSTOMER_GROUPS: {
        joinTableKey = 'customer_id'
        resourceKey = 'customer_group_id'
        joinTable = 'customer_group_customers'
        joinTableForeignKey =
          DiscountConditionJoinTableForeignKey.CUSTOMER_GROUP_ID

        conditionTable = DiscountConditionCustomerGroup
        break
      }
      case DiscountConditionTypeEnum.STORE_GROUPS: {
        joinTableKey = 'store_id'
        resourceKey = 'store_group_id'
        joinTable = 'store_group_stores'
        joinTableForeignKey =
          DiscountConditionJoinTableForeignKey.STORE_GROUP_ID

        conditionTable = DiscountConditionStoreGroup
        break
      }
      default:
        break
    }

    return {
      joinTable,
      joinTableKey,
      resourceKey,
      joinTableForeignKey,
      conditionTable,
    }
  }

  async removeConditionResourcess(
    id: string,
    type: DiscountConditionTypeEnum,
    resourceIds: string[],
  ): Promise<DeleteResult | void> {
    const { conditionTable, joinTableForeignKey } =
      this.getJoinTableResourceIdentifierss(type)

    if (!conditionTable || !joinTableForeignKey) {
      return Promise.resolve()
    }

    return await this.createQueryBuilder()
      .delete()
      .from(conditionTable)
      .where({ condition_id: id, [joinTableForeignKey]: In(resourceIds) })
      .execute()
  }

  async addConditionResourcess(
    conditionId: string,
    resourceIds: string[],
    type: DiscountConditionTypeEnum,
    overrideExisting = false,
  ): Promise<
    (
      | DiscountConditionProduct
      | DiscountConditionProductType
      | DiscountConditionProductCollection
      | DiscountConditionProductTag
      | DiscountConditionCustomerGroup
      | DiscountConditionStoreGroup
    )[]
  > {
    let toInsert: { condition_id: string; [x: string]: string }[] | [] = []

    const { conditionTable, joinTableForeignKey } =
      this.getJoinTableResourceIdentifierss(type)

    if (!conditionTable || !joinTableForeignKey) {
      return Promise.resolve([])
    }

    toInsert = resourceIds.map((rId) => ({
      condition_id: conditionId,
      [joinTableForeignKey]: rId,
    }))

    const qr = this.createQueryBuilder()
      .insert()
      .orIgnore(true)
      .into(conditionTable)
      .values(toInsert)

    const insertResult = await qr.execute()

    if (overrideExisting) {
      await this.createQueryBuilder()
        .delete()
        .from(conditionTable)
        .where({
          condition_id: conditionId,
          [joinTableForeignKey]: Not(In(resourceIds)),
        })
        .execute()
    }

    return await this.manager
      .createQueryBuilder(conditionTable, 'discon')
      .select()
      .where(insertResult.identifiers)
      .getMany()
  }

  async queryConditionTable({ type, condId, resourceId }): Promise<number> {
    const {
      conditionTable,
      joinTable,
      joinTableForeignKey,
      resourceKey,
      joinTableKey,
    } = this.getJoinTableResourceIdentifierss(type)

    return await this.manager
      .createQueryBuilder(conditionTable, 'dc')
      .innerJoin(
        joinTable,
        'resource',
        `dc.${joinTableForeignKey} = resource.${resourceKey} and resource.${joinTableKey} = :resourceId `,
        {
          resourceId,
        },
      )
      .where(`dc.condition_id = :conditionId`, {
        conditionId: condId,
      })
      .getCount()
  }

  async queryConditionTypesTable({
    type,
    condId,
    resourceId,
  }): Promise<number> {
    const {
      conditionTable,
      joinTable,
      joinTableForeignKey,
      resourceKey,
      joinTableKey,
    } = this.getJoinTableResourceIdentifierss(type)

    return await this.manager
      .createQueryBuilder(conditionTable, 'dc')
      .innerJoin(
        joinTable,
        'resource',
        `(dc.${joinTableForeignKey} = resource.${resourceKey} or dc.${joinTableForeignKey} = resource.type_lv1_id or dc.${joinTableForeignKey} = resource.type_lv2_id) and resource.${joinTableKey} = :resourceId`,
        {
          resourceId,
        },
      )
      .where(`dc.condition_id = :conditionId`, {
        conditionId: condId,
      })
      .getCount()
  }

  async isValidForProduct(
    discountRuleId: string,
    productId: string,
  ): Promise<boolean> {
    const discountConditions = await this.createQueryBuilder('discon')
      .select(['discon.id', 'discon.type', 'discon.operator'])
      .where('discon.discount_rule_id = :discountRuleId', {
        discountRuleId,
      })
      .getMany()

    // in case of no discount conditions, we assume that the discount
    // is valid for all
    if (!discountConditions.length) {
      return true
    }

    // retrieve all conditions for each type where condition type id is in jointable (products, product_types, product_collections, product_tags)
    // "E.g. for a given product condition, give me all products affected by it"
    // for each of these types, we check:
    //    if condition operation is `in` and the query for conditions defined for the given type is empty, the discount is invalid
    //    if condition operation is `not_in` and the query for conditions defined for the given type is not empty, the discount is invalid
    for (const condition of discountConditions) {
      const numConditions = await this.queryConditionTable({
        type: condition.type,
        condId: condition.id,
        resourceId: productId,
      })

      if (
        condition.operator === DiscountConditionOperator.IN &&
        numConditions === 0
      ) {
        return false
      }

      if (
        condition.operator === DiscountConditionOperator.NOT_IN &&
        numConditions > 0
      ) {
        return false
      }
    }

    return true
  }

  async canApplyForCustomer(
    discountRuleId: string,
    customerId: string,
  ): Promise<boolean> {
    const discountConditions = await this.createQueryBuilder('discon')
      .select(['discon.id', 'discon.type', 'discon.operator'])
      .where('discon.discount_rule_id = :discountRuleId', {
        discountRuleId,
      })
      .andWhere('discon.type = :type', {
        type: DiscountConditionType.CUSTOMER_GROUPS,
      })
      .getMany()

    // in case of no discount conditions, we assume that the discount
    // is valid for all

    if (!discountConditions.length) {
      return true
    }

    // retrieve conditions for customer groups
    // for each customer group
    //   if condition operation is `in` and the query for customer group conditions is empty, the discount is invalid
    //   if condition operation is `not_in` and the query for customer group conditions is not empty, the discount is invalid
    for (const condition of discountConditions) {
      const numConditions = await this.queryConditionTable({
        type: 'customer_groups',
        condId: condition.id,
        resourceId: customerId,
      })

      if (
        condition.operator === DiscountConditionOperator.IN &&
        numConditions === 0
      ) {
        return false
      }

      if (
        condition.operator === DiscountConditionOperator.NOT_IN &&
        numConditions > 0
      ) {
        return false
      }
    }

    return true
  }

  async canApplyForStore(
    discountRuleId: string,
    storeId: string,
  ): Promise<boolean> {
    const discountConditions = await this.createQueryBuilder('discon')
      .select(['discon.id', 'discon.type', 'discon.operator'])
      .where('discon.discount_rule_id = :discountRuleId', {
        discountRuleId,
      })
      .andWhere('discon.type = :type', {
        type: DiscountConditionTypeEnum.STORE_GROUPS,
      })
      .getMany()

    // in case of no discount conditions, we assume that the discount
    // is valid for all
    if (!discountConditions.length) {
      return true
    }

    // retrieve conditions for customer groups
    // for each customer group
    //   if condition operation is `in` and the query for customer group conditions is empty, the discount is invalid
    //   if condition operation is `not_in` and the query for customer group conditions is not empty, the discount is invalid
    for (const condition of discountConditions) {
      const numConditions = await this.queryConditionTable({
        type: 'store_groups',
        condId: condition.id,
        resourceId: storeId,
      })

      if (
        condition.operator === DiscountConditionOperator.IN &&
        numConditions === 0
      ) {
        return false
      }

      if (
        condition.operator === DiscountConditionOperator.NOT_IN &&
        numConditions > 0
      ) {
        return false
      }
    }

    return true
  }

  async canApplyForProducts(
    discountRuleId: string,
    productId: string,
  ): Promise<boolean> {
    const discountConditions = await this.createQueryBuilder('discon')
      .select(['discon.id', 'discon.type', 'discon.operator'])
      .where('discon.discount_rule_id = :discountRuleId', {
        discountRuleId,
      })
      .andWhere('discon.type = :type', {
        type: DiscountConditionTypeEnum.PRODUCTS,
      })
      .getMany()

    // in case of no discount conditions, we assume that the discount
    // is valid for all
    if (!discountConditions.length) {
      return true
    }

    // retrieve conditions for customer groups
    // for each customer group
    //   if condition operation is `in` and the query for customer group conditions is empty, the discount is invalid
    //   if condition operation is `not_in` and the query for customer group conditions is not empty, the discount is invalid
    for (const condition of discountConditions) {
      const numConditions = await this.queryConditionTable({
        type: 'products',
        condId: condition.id,
        resourceId: productId,
      })

      if (
        condition.operator === DiscountConditionOperator.IN &&
        numConditions === 0
      ) {
        return false
      }

      if (
        condition.operator === DiscountConditionOperator.NOT_IN &&
        numConditions > 0
      ) {
        return false
      }
    }

    return true
  }

  async canApplyForProductTypes(
    discountRuleId: string,
    productId: string,
  ): Promise<boolean> {
    const discountConditions = await this.createQueryBuilder('discon')
      .select(['discon.id', 'discon.type', 'discon.operator'])
      .where('discon.discount_rule_id = :discountRuleId', {
        discountRuleId,
      })
      .andWhere('discon.type = :type', {
        type: DiscountConditionTypeEnum.PRODUCT_TYPES,
      })
      .getMany()

    // in case of no discount conditions, we assume that the discount
    // is valid for all

    if (!discountConditions.length) {
      return true
    }

    // retrieve conditions for customer groups
    // for each customer group
    //   if condition operation is `in` and the query for customer group conditions is empty, the discount is invalid
    //   if condition operation is `not_in` and the query for customer group conditions is not empty, the discount is invalid
    for (const condition of discountConditions) {
      const numConditions = await this.queryConditionTypesTable({
        type: 'product_types',
        condId: condition.id,
        resourceId: productId,
      })

      if (
        condition.operator === DiscountConditionOperator.IN &&
        numConditions === 0
      ) {
        return false
      }

      if (
        condition.operator === DiscountConditionOperator.NOT_IN &&
        numConditions > 0
      ) {
        return false
      }
    }

    return true
  }

  async canApplyForCart(
    discountRuleId: string,
    cart: Cart,
    amount: number,
  ): Promise<boolean> {
    for (const item of cart.items) {
      const isStore = await this.canApplyForStore(
        discountRuleId,
        (item as LineItem).store_id,
      )

      const isProduct = await this.canApplyForProducts(
        discountRuleId,
        (item as LineItem).variant.product_id,
      )

      const isTypes = await this.canApplyForProductTypes(
        discountRuleId,
        (item as LineItem).variant.product_id,
      )

      if (isStore && isProduct && isTypes && cart.subtotal >= amount) {
        return true
      }
    }
    return false
  }

  async canApplyForItem(
    discountRuleId: string,
    item: LineItem,
  ): Promise<boolean> {
    const isStore = await this.canApplyForStore(discountRuleId, item.store_id)

    const isProduct = await this.canApplyForProducts(
      discountRuleId,
      item.variant.product_id,
    )

    const isTypes = await this.canApplyForProductTypes(
      discountRuleId,
      item.variant.product_id,
    )

    if (isStore && isProduct && isTypes) {
      return true
    }
    return false
  }
}
