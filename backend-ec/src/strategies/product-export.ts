/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AbstractBatchJobStrategy,
  BatchJobService,
  CreateBatchJobInput,
  defaultAdminProductRelations,
  ProductStatus,
} from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { Parser } from 'json2csv'
import { EntityManager } from 'typeorm'

import { GetProductCmsBody } from '../modules/product/controllers/get-list-products.cms.admin.controller'
import { ProductSearchCmsService } from '../modules/product/services/product-search-cms.service'
import { Product } from './../modules/product/entity/product.entity'
import { ProductService } from './../modules/product/services/product.service'
import { UploadService } from './../modules/upload/upload.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  productSearchCmsService: ProductSearchCmsService
  logger: Logger
  uploadService: UploadService
  productService: ProductService
}

const parserObj = new Parser()

export type ProductCsvLine = {
  商品コード: string // id
  店舗ID: string // store_id
  作品タイトル: string // title
  つくつな対象商品フラグ: boolean // is_maker_ship
  カスタマイズ対応フラグ: boolean // is_customizable
  作品紹介文: string // description
  ステータス: ProductStatus // status
  商品小カテゴリー: string // subcategory
  商品中カテゴリー: string // medium category
  発送地: string // ship_from_id
  ギフトラッピング: string // gift_cover
  発送目安: string // ship_after
  備考: string // remarks
  素材: string // material_id
  サイズ備考: string // sizes_note
  商品単価マージン率: number //   margin_rate
  商品単価特別マージン率: number // spec_rate
  特別マージン設定期間開始日: string // spec_starts_at
  特別マージン設定期間終了日: string // spec_ends_at
  [key: string]: any // other fields
}

export function convertProductToCSVLine(product: Product): ProductCsvLine {
  // images (max 20 images)
  const imagesPart = {}
  product.images.forEach((image, index) => {
    imagesPart[`画像#${index + 1}`] = image.url
  })

  // tags
  const tagsPart = product.tags
    .slice(0, 20)
    .map((tag) => tag.value)
    .join('|')

  // addons
  const addonsPart = product.product_addons
    .slice(0, 20)
    .map((addon) => addon.lv1_id)
    .join('|')

  // colors
  const colorsPart = product.product_colors
    .slice(0, 20)
    .map((color) => color.color_id)
    .join('|')

  // shipping options
  const shippingOptionsPart = {}
  product.product_shipping_options.slice(0, 20).forEach((so, index) => {
    shippingOptionsPart[`配送方法-${index + 1}`] = so.shipping_option_id
    shippingOptionsPart[`複数まとめ買い時の追加送料-${index + 1}`] =
      so.bulk_added_price || 0
  })

  // specs
  const specsPart = {}
  product.product_specs.slice(0, 20).forEach((ps, index) => {
    specsPart[`仕様項目名${index + 1}`] = ps.lv1_id || ''
    specsPart[`仕様種類ID${index + 1}`] = ps.lv2_id || ''
    specsPart[`仕様詳細ID${index + 1}`] = ps.lv3_id || ''
    specsPart[`仕様種類${index + 1}`] = ps.lv2_content || ''
    specsPart[`仕様詳細${index + 1}`] = ps.lv3_content || ''
  })

  // prices
  const pricesPart = {}
  const prices = product.variants[0]?.prices

  pricesPart['販売価格'] =
    prices?.find((price) => !price.price_list_id)?.amount || 0
  const salePrice = prices?.find((price) => !!price.price_list_id)

  if (!!salePrice) {
    pricesPart['セール価格'] = salePrice.amount
    pricesPart['セール期間開始日'] =
      salePrice.price_list?.starts_at?.toString() || ''
    pricesPart['セール期間終了日'] =
      salePrice.price_list?.ends_at?.toString() || ''
  }

  // variants
  const variantsPart = {}
  product.variants.forEach((variant, index) => {
    variantsPart[`【バリエーション${index + 1}】ID`] = variant.id
    variantsPart[`【バリエーション${index + 1}】カラー`] =
      variant.options.find((o) => o.option_id === 'opt_color')?.value || ''
    variantsPart[`【バリエーション${index + 1}】サイズ`] =
      variant.options.find((o) => o.option_id === 'opt_color')?.value || ''
    variantsPart[`【バリエーション${index + 1}】在庫数`] =
      variant.inventory_quantity
    variantsPart[`【バリエーション${index + 1}】受注生産フラグ`] =
      !variant.manage_inventory
  })

  const sizesPart = {}
  if (Array.isArray(product.metadata?.sizes)) {
    const sizes = product.metadata.sizes
    for (let i = 0; i < sizes.length; i++) {
      for (let j = 0; j < sizes[i].length; j++) {
        const sizeItem = sizes[i][j]
        if (sizeItem && !!sizeItem.value && !!sizeItem.size_id) {
          sizesPart[`【サイズ${i + 1}-${j + 1}】`] = sizeItem.size_id
          sizesPart[`【サイズ寸法${i + 1}-${j + 1}】`] = sizeItem.value
          sizesPart[`【サイズ項目名${i + 1}-${j + 1}】`] = sizeItem.name || ''
          sizesPart[`【サイズフリーフラグ${i + 1}-${j + 1}】`] =
            sizeItem.is_free
        }
      }
    }
  }

  // console.log('Convert successfully product with id: ', product.id)

  return {
    商品コード: product.id,
    店舗ID: product.store_id,
    作品タイトル: product.title,
    つくつな対象商品フラグ: product.is_maker_ship,
    カスタマイズ対応フラグ: product.is_customizable,
    作品紹介文: product.description || '',
    ステータス: product.status,
    商品小カテゴリー: product.type_id,
    商品中カテゴリー: product.type_lv2_id,
    発送地: product.ship_from_id,
    ギフトラッピング: product.gift_cover,
    発送目安: product.ship_after,
    備考: product.remarks || '',
    素材: product.material_id,
    サイズ備考: (product.metadata.sizes_note as string) || '',
    商品単価マージン率: product.margin_rate || 0,
    商品単価特別マージン率: product.spec_rate || 0,
    特別マージン設定期間開始日: product.spec_starts_at?.toString() || '',
    特別マージン設定期間終了日: product.spec_ends_at?.toString() || '',
    ...imagesPart,
    キーワード: tagsPart || '',
    オプション名: addonsPart || '',
    カラー: colorsPart || '',
    ...shippingOptionsPart,
    ...specsPart,
    ...pricesPart,
    ...variantsPart,
    ...sizesPart,
  }
}

class ProductExportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'product-export-strategy'
  static batchType = 'product-export'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected productSearchCmsService_: ProductSearchCmsService
  protected logger_: Logger
  protected uploadService_: UploadService
  protected productService_: ProductService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.productSearchCmsService_ = container.productSearchCmsService
    this.logger_ = container.logger
    this.uploadService_ = container.uploadService
    this.productService_ = container.productService
  }

  async prepareBatchJobForProcessing(
    batchJob: CreateBatchJobInput,
    req: Express.Request,
  ): Promise<CreateBatchJobInput> {
    // make changes to the batch job's fields...
    // used to convert product search params later
    return batchJob
  }

  async preProcessBatchJob(batchJobId: string): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const batchJob = await this.batchJobService_
        .withTransaction(transactionManager)
        .retrieve(batchJobId)

      const searchParams = (batchJob.context?.searchParams ??
        {}) as GetProductCmsBody
      const config = (batchJob.context?.config ?? {}) as GetProductCmsBody

      // number of product to export
      const [products, count] = await this.productSearchCmsService_
        .withTransaction(transactionManager)
        .listProducts({ ...searchParams, ...config })

      const ids = (products || []).map((product) => product.id)

      batchJob.context.productIds = ids

      await this.batchJobService_
        .withTransaction(transactionManager)
        .update(batchJob, {
          result: {
            advancement_count: 0,
            count: products.length,
            stat_descriptors: [
              {
                key: 'product-export-count',
                name: 'Number of products to export',
                message: `${products.length} product(s) will be exported.`,
              },
            ],
          },
        })
    })
  }

  async processJob(batchJobId: string): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const batchJob = await this.batchJobService_
        .withTransaction(transactionManager)
        .retrieve(batchJobId)

      const productIds = (batchJob.context.productIds || []) as string[]

      const productsToExport = await Promise.all(
        productIds.map(async (productId) => {
          const product = await this.productService_
            .withTransaction(transactionManager)
            .retrieve_(
              { id: productId },
              {
                relations: defaultAdminProductRelations.concat([
                  'ship_from',
                  'store',
                  'store.store_detail',
                  'store.owner',
                  'product_material',
                  'product_specs',
                  'product_specs.lv1',
                  'product_specs.lv2',
                  'product_specs.lv3',
                  'product_colors',
                  'product_colors.color',
                  'product_images',
                  'product_addons',
                  'product_shipping_options',
                ]),
              },
            )

          return convertProductToCSVLine(product as Product)
        }),
      )

      const csv = parserObj.parse(productsToExport)

      // fs.writeFileSync(filePath, csv)
      // upload csv file to S3 private bucket
      await this.uploadService_
        .withTransaction(transactionManager)
        .uploadCsv(csv, batchJobId)

      await this.batchJobService_
        .withTransaction(transactionManager)
        .update(batchJobId, {
          result: {
            advancement_count: productsToExport.length,
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
    result: T,
  ): Promise<void> {
    // different implementation...
    this.logger_.error('Batch job with id ' + batchJobId + ' failed ==> ' + err)
  }
}

export default ProductExportStrategy
