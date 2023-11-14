/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  AbstractBatchJobStrategy,
  BatchJobService,
  Order,
} from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import Papa from 'papaparse'
import { EntityManager, In } from 'typeorm'

import { getCustomerId, getOrderId, getProdId } from '../helpers/display_id'
import { GetListOrderCmsBody } from '../modules/order/controllers/get-list-order.cms.admin.controller'
import { Order as NewOrder } from '../modules/order/entity/order.entity'
import { OrderService } from '../modules/order/services/order.service'
import { OrderSearchService } from '../modules/order/services/order-search.service'
import { UploadService } from '../modules/upload/upload.service'
import UserService from '../modules/user/services/user.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  userService: UserService
  uploadService: UploadService
  logger: Logger
  orderService: OrderService
  orderSearchService: OrderSearchService
}

type CsvLine = {
  受付番号: string //Receipt number
  注文日: Date //Order Date
  顧客ID: string //Customer ID
  ニックネーム: string //Nickname
  顧客種別: string //Customer Type
  氏名: string //Full name
  フリガナ: string //Full name furigana
  住所: string //Address
  メールアドレス: string //Email address
  電話番号: string //Phone Number
  性別: string //Gender
  生年月日: string //Date of birth
  顧客情報備考: string //Customer Information Remarks
  使用クーポン: string //Coupon used
  プロモーションコード: string //Promotion Code
  顧客メモ: string //Customer Notes
  注文番号: string //Order number
  ステータス: string //Status
  商品SKU: string // Product SKU
  店舗名: string //Store Name
  メモ: string //Memo
  郵便番号: string //Postal Code
  都道府県: string //State/Province
  市区町村名: string //City/town/village name
  '建物名・部屋番号': string //Building name/room number
  受取人名: string //Recipient Name
  配達指定日: string //Delivery date
  配達指定時間: string //Delivery time
  発送伝票番号: string //Shipping slip number
  発送手段: string //Shipping method
  備考: string //Remarks
  商品コード: string //Item Code
  ギフト設定: string //Gift Settings
  '利用クーポン・PC': string //Coupon/PC
  単価: string //Unit Price
  'セール割引率・額': string //Sale Discount Rate / Amount
  数量: string //Quantity
  按分率: string //Proportion
  小計: number //Subtotal
  値引き: number //Discount
  送料: number //Shipping & Handling
  手数料: number //Commission fee
  利用ポイント: number //Points used
  合計: number //Total
  金額変更: string //Change Amount
  加算予定ポイント: number //Points to be added
}

class OrderExportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'export-order-strategy'
  static batchType = 'export-order'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected userService_: UserService
  protected uploadService_: UploadService
  protected logger_: Logger
  protected orderSearchService_: OrderSearchService
  protected orderService_: OrderService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.userService_ = container.userService
    this.uploadService_ = container.uploadService
    this.logger_ = container.logger
    this.orderSearchService_ = container.orderSearchService
    this.orderService_ = container.orderService
  }

  async preProcessBatchJob(batchJobId: string): Promise<void> {
    const batchJob = await this.batchJobService_.retrieve(batchJobId)

    const searchParams = (batchJob.context?.searchParams ??
      {}) as GetListOrderCmsBody

    const config = (batchJob.context?.config ?? {}) as FindConfig<Order>

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [orders, count] = await this.orderSearchService_.searchOrderCms({
      ...searchParams,
      ...config,
    })
    const ids = (orders || []).map((order) => order.id)
    batchJob.context.orderIds = ids

    await this.batchJobService_.update(batchJob, {
      result: {
        advancement_count: 0,
        count: orders.length,
        stat_descriptors: [
          {
            key: 'order-export-count',
            name: 'Number of orders to export',
            message: `${orders.length} order(s) will be exported.`,
          },
        ],
      },
    })
  }

  async processJob(batchJobId: string): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const batchJob = await this.batchJobService_
        .withTransaction(transactionManager)
        .retrieve(batchJobId)

      const ordersIds = (batchJob.context.orderIds || []) as string[]
      const config = (batchJob.context?.config ?? {}) as FindConfig<Order>

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [orders, count] = await this.orderService_
        .withTransaction(transactionManager)
        .listOrderCms(
          { id: In(ordersIds) },
          {
            relations: [
              'store',
              'store.store_detail',
              'customer',
              'shipping_address',
              'shipping_address.prefecture',
              'shipping_methods',
              'items',
              'discounts',
              'discounts.parent_discount',
            ],
            ...config,
          },
        )
      const csvLines: CsvLine[] = []
      for (const order of orders) {
        const user = await this.userService_.retrieve_(order.customer_id, {
          relations: ['address'],
        })
        //@ts-expect-error
        this.orderService_.calculatePromoCode(order)

        const isStore = (order as NewOrder).store_id ? true : false

        csvLines.push({
          受付番号: getOrderId(order.display_id, isStore),
          注文日: order.created_at,
          //@ts-expect-error
          顧客ID: getCustomerId(order.customer?.display_id),
          //@ts-expect-error
          ニックネーム: order.customer?.nickname,
          顧客種別: user?.type,
          氏名: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`,
          フリガナ: '',
          住所: [
            //@ts-expect-error
            order.shipping_address?.prefecture?.name,
            order.shipping_address?.city,
            order.shipping_address?.address_1,
            order.shipping_address?.address_2,
          ].join(','),
          メールアドレス: user?.email,
          電話番号: user?.address?.phone,
          性別: '', //Gender
          生年月日: '', //Date of birth
          顧客情報備考: order.metadata?.notes as string,
          使用クーポン: '', //Coupon used
          //@ts-expect-error
          プロモーションコード: order.promo_code_used,
          顧客メモ: user?.metadata?.notes as string,
          //@ts-expect-error
          注文番号: getOrderId(order.display_id, order.store ? true : false),
          ステータス: order.status,
          商品SKU: (order.items || [])
            .map((item) => item.variant?.title)
            .join(','),
          //@ts-expect-error
          店舗名: order.store?.name,
          メモ: order.shipping_address?.metadata?.notes as string,
          郵便番号: order.shipping_address?.postal_code,
          //@ts-expect-error
          都道府県: order.shipping_address?.prefecture_id,
          市区町村名: order.shipping_address?.address_1,
          '建物名・部屋番号': order.shipping_address?.address_2,
          受取人名: [
            order.shipping_address?.last_name,
            order.shipping_address?.first_name,
          ].join(' '),
          //@ts-expect-error
          配達指定日: order.metadata?.preferred_received_at?.date,
          //@ts-expect-error
          配達指定時間: order.metadata?.preferred_received_at?.time,
          発送伝票番号: '',
          発送手段: (order.shipping_methods || [])
            .map((method) => method?.shipping_option?.name)
            .join(','),
          備考: order.metadata?.note as string,
          商品コード: (order.items || [])
            //@ts-expect-error
            .map((item) => getProdId(item.variant?.product?.display_id))
            .join(','),
          ギフト設定: '',
          '利用クーポン・PC': '',
          単価: (order.items || []).map((item) => item?.unit_price).join(','),
          'セール割引率・額': (order.items || [])
            .map((item) => item?.discount_total)
            .join(','),
          数量: (order.items || []).map((item) => item?.quantity).join(','),
          按分率: '',
          //@ts-expect-error
          小計: order.metadata.price?.subtotal,
          値引き: 0,
          //@ts-expect-error
          送料: order.metadata.price?.shipping_total,
          手数料: 0,
          利用ポイント: 0,
          //@ts-expect-error
          合計: order.metadata.price?.total,
          金額変更: '',
          加算予定ポイント: 0,
        })
      }

      await this.uploadService_
        .withTransaction(transactionManager)
        .uploadCsv(Papa.unparse(csvLines), batchJobId)

      await this.batchJobService_
        .withTransaction(transactionManager)
        .update(batchJobId, {
          result: {
            advancement_count: csvLines.length,
            progress: csvLines.length / (orders?.length || 1),
          },
        })
    })
  }

  async buildTemplate(): Promise<string> {
    return ''
  }
  // handle error
  protected async handleProcessingError<T>(
    batchJobId: string,
    err: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    result: T,
  ): Promise<void> {
    // different implementation...
    this.logger_.error('Batch job with id ' + batchJobId + ' failed ==> ' + err)
  }
}

export default OrderExportStrategy
