/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  AbstractBatchJobStrategy,
  BatchJobService,
  Order,
  ProductOptionValue,
} from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import Papa from 'papaparse'
import { EntityManager, In } from 'typeorm'

import { getOrderId, getProdId } from '../helpers/display_id'
import { LineItem } from '../modules/cart/entity/line-item.entity'
import { GetListOrderCmsBody } from '../modules/order/controllers/get-list-order.cms.admin.controller'
import { Order as NewOrder } from '../modules/order/entity/order.entity'
import { OrderService } from '../modules/order/services/order.service'
import { OrderSearchService } from '../modules/order/services/order-search.service'
import { Product } from '../modules/product/entity/product.entity'
import { ProductReviewsService } from '../modules/product/services/product-reviews.service'
import { UploadService } from '../modules/upload/upload.service'
import UserService from '../modules/user/services/user.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  userService: UserService
  uploadService: UploadService
  logger: Logger
  orderService: OrderService
  productReviewsService: ProductReviewsService
  orderSearchService: OrderSearchService
}

type CsvLine = {
  注文NO: string //Order no
  配送先名: string //Destination name
  配送先住所: string //Shipping address
  受注日: string //Order date
  出荷予定日: string //Scheduled shipment date
  到着予定日: string //Scheduled arrival date
  着用日: string //Date of landing
  返却予定日: string //Scheduled return date
  備考: string //remarks
  伝票内口数: string //Number of inner peaks in the slip
  異伝票同一配送先統一コード: string //Different voucher equal delivery destination unified code
  下見フラグ: string //Preview flag
  直仕上出し受注No: string //Direct finishing order NO
  明細NO: string //Details NO
  商品コード: string //Product code
  SKU識別コード: string //SKU identification code
  商品名: string //Product name
  数量: string //quantity
  検品ｽｷｬﾝ回数: string //Number of inspections
  ロック開始日: string //Lock start date
  レンタル終了日変更フラグ: string //Rental end date change flag
  返却日変更フラグ: string //Return date change flag
  キャンセルフラグ: string //Cancellation flag
  返却不要フラグ: string //No returned flag
  お手入れ出し状態管理必要フラグ: string //Care status management required flag
  別着物セット品小物フラグ: string //Separate kimono set goods accessory flag
  お手入れ出し返却期間長期コード: string //Career return period long -term code
}

class OrderWmsExportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'export-order-wms-strategy'
  static batchType = 'export-wms-order'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected userService_: UserService
  protected uploadService_: UploadService
  protected logger_: Logger
  protected orderService_: OrderService
  protected productReviewService_: ProductReviewsService
  protected orderSearchService_: OrderSearchService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.userService_ = container.userService
    this.uploadService_ = container.uploadService
    this.logger_ = container.logger
    this.orderService_ = container.orderService
    this.productReviewService_ = container.productReviewsService
    this.orderSearchService_ = container.orderSearchService
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
      const config = (batchJob.context.config || {}) as FindConfig<Order>

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
        const reviewflag = await Promise.all(
          order.items.map(
            async (i) => await this.getPreviewFlag(i.variant?.product_id),
          ),
        )
        //@ts-expect-error
        this.orderService_.calculatePromoCode(order)

        const isStore = (order as NewOrder).store_id ? true : false

        try {
          csvLines.push({
            注文NO: getOrderId(order?.display_id, isStore),
            配送先名: [
              order?.shipping_address?.first_name,
              order?.shipping_address?.last_name,
            ].join(' '),
            配送先住所: [
              //@ts-expect-error
              order?.shipping_address?.prefecture?.name,
              order?.shipping_address?.address_1,
              order?.shipping_address?.address_2,
            ].join(','),
            受注日: order?.created_at
              ?.toLocaleDateString('en-GB')
              .split('/')
              .reverse()
              .join(''),
            出荷予定日: (order as NewOrder)?.shipped_at
              ?.toLocaleDateString('en-GB')
              .split('/')
              .reverse()
              .join(''),
            到着予定日: order?.created_at
              ?.toLocaleDateString('en-GB')
              .split('/')
              .reverse()
              .join(''),
            着用日: new Date(
              order?.created_at.getTime() +
                this.getShipFrom(order?.items as LineItem[]) *
                  24 *
                  60 *
                  60 *
                  1000,
            )
              ?.toLocaleDateString('en-GB')
              .split('/')
              .reverse()
              .join(''),
            返却予定日: new Date(
              order?.created_at.getTime() +
                (this.getShipFrom(order?.items as LineItem[]) + 1) *
                  24 *
                  60 *
                  60 *
                  1000,
            )
              .toLocaleDateString('en-GB')
              .split('/')
              .reverse()
              .join(''),
            備考: '',
            伝票内口数:
              ((order as NewOrder)?.store?.metadata?.memo as string) || '',
            異伝票同一配送先統一コード: '',
            下見フラグ: reviewflag.join(','),
            直仕上出し受注No: '',
            明細NO: (order.items || [])
              .map((item) =>
                getProdId((item.variant?.product as Product)?.display_id),
              )
              .join(','),
            商品コード: (order.items || [])
              .map((item) => (item.variant?.product as Product)?.display_code)
              .join(','),
            SKU識別コード: (order.items || [])
              .map((item) => this.getProductVariantSku(item.variant?.options))
              .join(','),
            商品名: (order.items || [])
              .map((item) => (item.variant?.product as Product)?.title)
              .join(','),
            数量: (order.items || []).map((item) => item.quantity).join(','),
            検品ｽｷｬﾝ回数: (order.items || [])
              .map((item) => item.quantity)
              .join(','),
            ロック開始日: (order as NewOrder)?.shipped_at
              ?.toLocaleDateString('en-GB')
              .split('/')
              .reverse()
              .join(''),
            レンタル終了日変更フラグ: '0',
            返却日変更フラグ: '0',
            キャンセルフラグ: order?.status === 'canceled' ? '1' : '0',
            返却不要フラグ: '1',
            お手入れ出し状態管理必要フラグ: '1',
            別着物セット品小物フラグ: '1',
            お手入れ出し返却期間長期コード: '1',
          })
        } catch (error) {
          this.logger_.error(error)
        }
      }

      await this.uploadService_
        .withTransaction(transactionManager)
        .uploadCsv(Papa.unparse(csvLines), batchJobId)

      await this.batchJobService_
        .withTransaction(transactionManager)
        .update(batchJobId, {
          result: {
            advancement_count: csvLines.length,
            progress: csvLines.length / (count || 1),
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

  protected getShipFrom(items: LineItem[]) {
    let max = 0
    for (const item of items) {
      //@ts-expect-error
      if (item?.variant?.product?.ship_after > max) {
        //@ts-expect-error
        max = item?.variant?.product?.ship_after
      }
    }
    return max
  }

  protected genVariantTitle(color?: string, size?: string) {
    if (color && size) return `${color} / ${size}`

    if (color && !size) return `${color} / -`
    if (!color && size) return `- / ${size}`

    return ''
  }

  protected getProductVariantSku(options?: ProductOptionValue[]) {
    if (!options?.length) return ''

    const color = options.find(
      (option) => option.option_id === 'opt_color',
    )?.value
    const size = options.find(
      (option) => option.option_id === 'opt_size',
    )?.value

    return this.genVariantTitle(color, size)
  }

  async getPreviewFlag(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [review, count] = await this.productReviewService_.reviewsByProduct(
      id,
    )
    if (review?.length > 0) {
      return '1'
    }
    return '0'
  }
}

export default OrderWmsExportStrategy
