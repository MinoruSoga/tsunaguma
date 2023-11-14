/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AbstractBatchJobStrategy,
  BatchJobService,
  BatchJobStatus,
} from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import axios from 'axios'
import csv from 'csv-parser'
import _ from 'lodash'
import { EntityManager } from 'typeorm'

import { StoreGroupService } from '../modules/discount/services/store-group.service'
import StoreService from '../modules/store/services/store.service'
import { UploadService } from '../modules/upload/upload.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  storeGroupService: StoreGroupService
  uploadService: UploadService
  logger: Logger
  storeService: StoreService
}

const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:9000',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function convertCsvLineToStore(csvLine: CsvLine) {
  const store = {
    display_id: csvLine.店舗ID,
    name: csvLine.ショップ名,
  }
  return store
}

export type CsvLine = {
  店舗ID: string //	Store ID
  ショップ名: string // store name
}

class StoreCouponImportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'store-coupon-import-strategy'
  static batchType = 'store-coupon-import'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected storeGroupService_: StoreGroupService
  protected logger_: Logger
  protected uploadService_: UploadService
  protected storeService_: StoreService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.storeGroupService_ = container.storeGroupService
    this.logger_ = container.logger
    this.uploadService_ = container.uploadService
    this.storeService_ = container.storeService
  }

  async processJob(batchJobId: string): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const batchJob = await this.batchJobService_
        .withTransaction(transactionManager)
        .retrieve(batchJobId)

      const s3Key = batchJob.context.csvS3Key
      const jwtToken = batchJob.context.token

      let groupId = batchJob.context.groupId

      if (!s3Key || !jwtToken) return

      const csvStream = (await this.uploadService_
        .withTransaction(transactionManager)
        .getS3Stream(s3Key as string)) as NodeJS.ReadableStream

      const results = []
      csvStream
        .pipe(csv({}))
        .on('data', (data) => results.push(convertCsvLineToStore(data)))
        .on('end', async () => {
          let successCnt = 0

          if (!groupId) {
            const store_group = await this.storeGroupService_.create({
              name: `Group-${batchJob.id}`,
            })
            groupId = store_group.id
          }

          const data = []

          await Promise.all(
            results.map(async (e) => {
              const tmp = await this.storeService_.retrieveAdmin(
                { display_id: e.display_id },
                { select: ['id'] },
              )
              if (tmp) {
                data.push({ id: tmp.id })
              }
            }),
          )

          if (batchJob.status === BatchJobStatus.CANCELED) return
          const path = `/admin/store-groups/${groupId}/batch`
          await axiosInstance
            .post(
              path,
              { store_ids: data },
              {
                headers: { Authorization: `Bearer ${jwtToken}` },
              },
            )
            .then((res) => {
              successCnt++
            })
            .catch((error) => {
              this.logger_.error(error.message)
            })

          await this.batchJobService_.update(batchJobId, {
            result: {
              advancement_count: successCnt,
              medatadata: {
                groupId: groupId,
              },
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

export default StoreCouponImportStrategy
