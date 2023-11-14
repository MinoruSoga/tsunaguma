/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AbstractBatchJobStrategy, BatchJobService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import Papa from 'papaparse'
import { EntityManager } from 'typeorm'

import { GetProductCmsBody } from '../modules/product/controllers/get-list-products.cms.admin.controller'
import { Product } from '../modules/product/entity/product.entity'
import { ProductSearchCmsService } from '../modules/product/services/product-search-cms.service'
import { UploadService } from '../modules/upload/upload.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  uploadService: UploadService
  logger: Logger
  productSearchCmsService: ProductSearchCmsService
}

type CsvLine = {
  商品コード: string // Product code
  商品名: string // Product name
  廃止フラグ: string // Abolished flag
}

class ProductWmsExportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'export-product-wms-strategy'
  static batchType = 'export-wms-product'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected uploadService_: UploadService
  protected logger_: Logger
  protected productSearchCmsService: ProductSearchCmsService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.uploadService_ = container.uploadService
    this.logger_ = container.logger
    this.productSearchCmsService = container.productSearchCmsService
  }

  async preProcessBatchJob(batchJobId: string): Promise<void> {
    const batchJob = await this.batchJobService_.retrieve(batchJobId)

    const searchParams = (batchJob.context?.searchParams ??
      {}) as GetProductCmsBody
    const config = (batchJob.context?.config ?? {}) as FindConfig<Product>

    const [products] = await this.productSearchCmsService.listProducts({
      ...searchParams,
      ...config,
    })

    const ids = (products || []).map((product) => product.id)
    batchJob.context.productIds = ids

    await this.batchJobService_.update(batchJob, {
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
  }

  async processJob(batchJobId: string): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const batchJob = await this.batchJobService_
        .withTransaction(transactionManager)
        .retrieve(batchJobId)

      const productIds = (batchJob.context.productIds || []) as string[]
      const config = (batchJob.context.config || {}) as FindConfig<Product>

      const [products, count] = await this.productSearchCmsService
        .withTransaction(transactionManager)
        .listProducts({ ids: productIds, ...config })

      const csvLines: CsvLine[] = []
      for (const product of products) {
        try {
          csvLines.push({
            商品コード: product?.display_code,
            商品名: product?.title,
            廃止フラグ: '0',
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
}

export default ProductWmsExportStrategy
