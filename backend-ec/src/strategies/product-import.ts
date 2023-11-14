import {
  AbstractBatchJobStrategy,
  BatchJobService,
  BatchJobStatus,
} from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import axios from 'axios'
import csv from 'csv-parser'
import _ from 'lodash'
import Papa from 'papaparse'
import { EntityManager } from 'typeorm'

import { ProductService } from './../modules/product/services/product.service'
import { UploadService } from './../modules/upload/upload.service'
import { ProductCsvLine } from './product-export'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  productService: ProductService
  uploadService: UploadService
  logger: Logger
}

const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:9000',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function str2Bool(str) {
  if (!str) {
    return false
  }
  return str.toLowerCase() === 'true'
}

// function convertS3StreamToString() {}
function convertCsvLineToProduct(csvLine: ProductCsvLine) {
  const prod = {
    id: csvLine.商品コード || undefined, // product id
    store_id: csvLine.店舗ID || csvLine.store_id || undefined, // store id
    title: csvLine.作品タイトル || undefined, // title
    description: csvLine.作品紹介文 || undefined, // description
    status: csvLine.ステータス || undefined, // status
    images: [],
    type_id: csvLine.商品小カテゴリー || csvLine.商品中カテゴリー || undefined, // sub category or medium category
    tags: [],
    is_maker_ship: str2Bool(csvLine.つくつな対象商品フラグ), // is maker ship
    is_customizable: str2Bool(csvLine.カスタマイズ対応フラグ),
    ship_from_id: csvLine.発送地 || undefined,
    gift_cover: csvLine.ギフトラッピング || 'none',
    ship_after: csvLine.発送目安 || undefined,
    remarks: csvLine.備考 || undefined,
    material_id: csvLine.素材 || undefined,
    sizes_note: csvLine.サイズ備考 || undefined,
    product_addons: [],
    product_colors: [],
    metadata: undefined,
    margin_rate: Number(csvLine.商品単価マージン率) || undefined,
    spec_rate: Number(csvLine.商品単価特別マージン率) || undefined,
    spec_starts_at: csvLine.特別マージン設定期間開始日 || undefined,
    spec_ends_at: csvLine.特別マージン設定期間終了日 || undefined,
    product_giftcovers: undefined,
    product_specs: [],
    shipping_options: [],
    product_sizes: [],
    variants: [],
  }

  // images
  for (let i = 1; i <= 20; i++) {
    const key = `画像#${i}`
    if (!csvLine[key]) continue

    if (csvLine[key].startsWith('http') || csvLine[key].startsWith('https')) {
      prod.images.push(csvLine[key])
    } else {
      prod.images.push(
        `https://d3g95xjlzf5kh5.cloudfront.net/upload/${csvLine[key]}`,
      )
    }
  }

  if (prod.images?.length < 1) {
    prod.images = undefined
  }

  // tags
  if (csvLine['キーワード']) {
    prod.tags.push(
      ...csvLine['キーワード']
        .split('|')
        .filter((value: string) => !!value)
        .map((value: string) => ({ value })),
    )
  }
  if (prod.tags?.length < 1) {
    prod.tags = undefined
  }

  // addons
  if (csvLine['オプション名']) {
    prod.product_addons.push(
      ...csvLine['オプション名'].split('|').filter((value) => !!value),
    )
  }
  if (prod.product_addons?.length < 1) {
    prod.product_addons = undefined
  }

  // colors
  if (csvLine['カラー']) {
    prod.product_colors.push(
      ...csvLine['カラー'].split('|').filter((value) => !!value),
    )
  }
  if (prod.product_colors?.length < 1) {
    prod.product_colors = undefined
  }

  // specs
  for (let i = 1; i <= 15; i++) {
    const lv1Key = `仕様項目名${i}`
    const lv2Key = `仕様種類ID${i}`
    const lv2ContentKey = `仕様種類${i}`
    const lv3Key = `仕様詳細ID${i}`
    const lv3ContentKey = `仕様詳細${i}`
    if (
      csvLine[lv1Key] &&
      (csvLine[lv2Key] || csvLine[lv2ContentKey]) &&
      (csvLine[lv3Key] || csvLine[lv3ContentKey])
    ) {
      prod.product_specs.push({
        lv1_id: csvLine[lv1Key],
        lv2_id: csvLine[lv2Key] || undefined,
        lv2_content: csvLine[lv2ContentKey] || undefined,
        lv3_id: csvLine[lv3Key] || undefined,
        lv3_content: csvLine[lv3ContentKey] || undefined,
      })
    }
  }
  if (prod.product_specs.length < 1) {
    prod.product_specs = undefined
  }

  // shipping options
  for (let i = 1; i <= 15; i++) {
    const idKey = `配送方法-${i}`
    const bulkPriceKey = `複数まとめ買い時の追加送料-${i}`

    if (!csvLine[idKey]) continue
    prod.shipping_options.push({
      id: csvLine[idKey],
      bulk_added_price: Number(csvLine[bulkPriceKey]) || undefined,
    })
  }
  if (prod.shipping_options.length < 1) {
    prod.shipping_options = undefined
  }

  for (let j = 1; j <= 10; j++) {
    const prodSizes = []
    // 【サイズ1-1】,【サイズ項目名1-1】,【サイズ寸法1-1】,【サイズフリーフラグ1-1】
    for (let i = 1; i <= 10; i++) {
      const keyId = `【サイズ${j}-${i}】`
      const keyName = `【サイズ項目名${j}-${i}】`
      const keyValue = `【サイズ寸法${j}-${i}】`
      const keyIsFree = `【サイズフリーフラグ${j}-${i}】`
      if (!csvLine[keyId] || !csvLine[keyValue]) {
        continue
      }
      prodSizes.push({
        size_id: csvLine[keyId],
        name: csvLine[keyName],
        value: csvLine[keyValue],
        is_free: str2Bool(csvLine[keyIsFree]),
      })
    }
    if (prodSizes.length) {
      prod.product_sizes.push(prodSizes)
    }
  }
  if (prod.product_sizes.length < 1) {
    prod.product_sizes = undefined
  }

  const prices: any = [
    {
      amount: Number(csvLine.販売価格),
    },
  ]
  if (csvLine.セール価格) {
    prices.push({
      amount: Number(csvLine.セール価格),
      starts_at: csvLine.セール期間開始日 || undefined,
      ends_at: csvLine.セール期間終了日 || undefined,
    })
  }

  for (let i = 1; i <= 10; i++) {
    const keyId = `【バリエーション${i}】ID`
    const keyColor = `【バリエーション${i}】カラー`
    const keySize = `【バリエーション${i}】サイズ`
    const keyQuantity = `【バリエーション${i}】在庫数`
    const keyNotManageOrder = `【バリエーション${i}】受注生産フラグ`
    if (!csvLine[keyQuantity]) {
      continue
    }
    prod.variants.push({
      id: csvLine[keyId] || undefined,
      inventory_quantity: Number(csvLine[keyQuantity]),
      manage_inventory: !(csvLine[keyNotManageOrder] === 'true'),
      color: csvLine[keyColor] || undefined,
      size: csvLine[keySize] || undefined,
      prices,
    })
  }
  if (prod.variants.length < 1) {
    prod.variants = undefined
  }

  return prod
}

class ProductImportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'product-import-strategy'
  static batchType = 'product-import'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected productService_: ProductService
  protected logger_: Logger
  protected uploadService_: UploadService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.productService_ = container.productService
    this.logger_ = container.logger
    this.uploadService_ = container.uploadService
  }

  async processJob(batchJobId: string): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const batchJob = await this.batchJobService_
        .withTransaction(transactionManager)
        .retrieve(batchJobId)

      const s3Key = batchJob.context.csvS3Key
      const jwtToken = batchJob.context.token

      // not do anything if s3 key was not provided
      if (!s3Key || !jwtToken) return

      // get csv stream
      const csvStream = (await this.uploadService_
        .withTransaction(transactionManager)
        .getS3Stream(s3Key as string)) as NodeJS.ReadableStream

      const results = []
      csvStream
        .pipe(csv({}))
        .on('data', (data) => results.push(convertCsvLineToProduct(data)))
        .on('end', async () => {
          let successCnt = 0
          const errorRecords = []
          // console.log(results)
          for (const item of results) {
            // check if batch job was cancelled or not
            if (batchJob.status === BatchJobStatus.CANCELED) return
            const path = item.id
              ? `/admin/products/${item.id}` // update product
              : '/admin/products' // create product
            await axiosInstance
              .post(path, _.omit(item, ['id']), {
                headers: { Authorization: `Bearer ${jwtToken}` },
              })
              .then((res) => {
                successCnt++
              })
              .catch((error) => {
                this.logger_.error(error)
                item.error_message = error?.response?.data?.message || null
                errorRecords.push(item)
              })
          }

          await this.uploadService_
            .withTransaction(transactionManager)
            .uploadCsv(Papa.unparse(errorRecords), batchJobId + '_error')

          this.logger_.info('Total records failed: ' + errorRecords.length)
          for (const item of errorRecords) {
            this.logger_.error('fail:', `[${item.store_id}][${item.title}]`)
          }

          await this.batchJobService_
            // .withTransaction(transactionManager)
            .update(batchJobId, {
              result: {
                advancement_count: successCnt,
                medatadata: {
                  fail_records: errorRecords.map((item) =>
                    _.pick(item, ['id', 'store_id', 'title']),
                  ),
                },
                stat_descriptors: [
                  {
                    key: 'fail_count',
                    name: 'Number of products failed to import',
                    message: `Failed to import ${errorRecords.length} products from csv file`,
                  },
                  {
                    key: 'success_count',
                    name: 'Number of products successfully imported',
                    message: `${successCnt} products successfully imported`,
                  },
                ],
              },
            })
        })
        .on('error', this.logger_.error)
    })
  }

  async buildTemplate(): Promise<string> {
    return ''
  }
}

export default ProductImportStrategy
