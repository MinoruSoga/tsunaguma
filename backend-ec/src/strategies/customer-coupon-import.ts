/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AbstractBatchJobStrategy,
  BatchJobService,
  BatchJobStatus,
  CustomerGroupService,
} from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import axios from 'axios'
import csv from 'csv-parser'
import { EntityManager } from 'typeorm'

import { UploadService } from '../modules/upload/upload.service'
import CustomerService from '../modules/user/services/customer.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  customerGroupService: CustomerGroupService
  uploadService: UploadService
  logger: Logger
  customerService: CustomerService
}

const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:9000',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function convertCsvLineToCustomer(csvLine: CsvLine) {
  const store = {
    display_id: csvLine.顧客ID,
    nickname: csvLine.ニックネーム,
  }
  return store
}

export type CsvLine = {
  顧客ID: string //	Customer ID
  ニックネーム: string // nickname
}

class CustomerCouponImportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'customer-coupon-import-strategy'
  static batchType = 'customer-coupon-import'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected cgService_: CustomerGroupService
  protected logger_: Logger
  protected uploadService_: UploadService
  protected customerService_: CustomerService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.cgService_ = container.customerGroupService
    this.logger_ = container.logger
    this.uploadService_ = container.uploadService
    this.customerService_ = container.customerService
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
        .on('data', (data) => results.push(convertCsvLineToCustomer(data)))
        .on('end', async () => {
          let successCnt = 0

          if (!groupId) {
            const customer_group = await this.cgService_.create({
              name: `Group-${batchJob.id}`,
            })
            groupId = customer_group.id
          }

          const data = []

          await Promise.all(
            results.map(async (e) => {
              const tmp = await this.customerService_.retrieve_(
                { display_id: e.display_id },
                { select: ['id'] },
              )
              data.push({ id: tmp.id })
            }),
          )

          if (batchJob.status === BatchJobStatus.CANCELED) return
          const path = `/admin/customer-groups/${groupId}/customers/batch`
          await axiosInstance
            .post(
              path,
              { customer_ids: data },
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

export default CustomerCouponImportStrategy
