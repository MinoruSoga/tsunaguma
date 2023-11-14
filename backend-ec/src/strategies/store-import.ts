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

import { StoreBusinessForm } from './../modules/store/entity/store.entity'
import StoreService from './../modules/store/services/store.service'
import { UploadService } from './../modules/upload/upload.service'
import { CsvLine } from './store-export'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  storeService: StoreService
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

function convertCsvLineToStore(csvLine: CsvLine) {
  const store = {
    id: csvLine.店舗ID || undefined,
    email: csvLine.メールアドレス || undefined,
    nickname: csvLine.ニックネーム || undefined,
    name: csvLine.ショップ名,
    plan_type: csvLine.出店タイプ || undefined,
    business_form: csvLine.事業形態 || undefined,
    firstname:
      csvLine.事業形態 === StoreBusinessForm.CORPORATION
        ? csvLine.代表者氏名
        : csvLine.氏名,
    lastname:
      csvLine.事業形態 === StoreBusinessForm.CORPORATION
        ? csvLine.代表者氏名_last_name
        : csvLine.lastname,
    firstname_kana:
      csvLine.事業形態 === StoreBusinessForm.CORPORATION
        ? csvLine['代表者氏名（ふりがな）']
        : csvLine['氏名（ふりがな）'],
    lastname_kana:
      csvLine.事業形態 === StoreBusinessForm.CORPORATION
        ? csvLine['代表者氏名（ふりがな）last name']
        : csvLine['氏名（ふりがな）'],
    company_name: csvLine.法人団体名 || undefined,
    company_name_kana: csvLine['法人団体名（ふりがな）'] || undefined,
    post_code: csvLine.郵便番号 || undefined,
    prefecture_id: csvLine.都道府県 || undefined,
    addr_01: csvLine['市区町村名・番地'] || undefined,
    addr_02: csvLine['建物名・部屋番号'] || undefined,
    tel_number: csvLine.電話番号 || undefined,
    mobile_number: csvLine.携帯番号 || undefined,
    emerge_number: csvLine.緊急連絡先 || undefined,
    contact_firstname: csvLine.担当者氏名 || undefined,
    contact_lastname: csvLine.Contact_last_name || undefined,
    contact_firstname_kana: csvLine['担当者氏名（ふりがな）'],
    contact_lastname_kana: csvLine.contact_lastname_kana || undefined,
    gender: csvLine.性別 || undefined,
    birthday: csvLine.生年月日 || undefined,
    payment_method: csvLine.支払方法,
    registration_number: csvLine.登録番号 || undefined,
    referral_code: csvLine.紹介コード || undefined,
    url: csvLine.会社WebサイトURL || undefined,
    margin_rate: Number(csvLine.基本マージン率) || undefined,
    spec_rate: Number(csvLine.特別マージン率) || undefined,
    spec_starts_at: csvLine.特別マージン設定期間開始日 || undefined,
    spec_ends_at: csvLine.特別マージン設定期間終了日 || undefined,
    company_official_name: csvLine['法人名または屋号（正式名称）'] || undefined,
    payback_setting: {
      account_name: csvLine.口座名義人,
      account_number: csvLine.口座番号,
      account_type: csvLine.口座種別,
      branch_code: csvLine.支店番号,
      branch_name: csvLine.支店名,
      bank_name: csvLine.銀行名,
    },
  }
  return store
}

class StoreImportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'store-import-strategy'
  static batchType = 'store-import'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected storeService_: StoreService
  protected logger_: Logger
  protected uploadService_: UploadService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.storeService_ = container.storeService
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
          const errorRecords = []
          for (const item of results) {
            if (batchJob.status === BatchJobStatus.CANCELED) return
            const path = item.id
              ? `/admin/store/${item.id}/cms`
              : '/admin/store/register/cms'
            item.id
              ? await axiosInstance
                  .patch(path, _.omit(item, ['id']), {
                    headers: { Authorization: `Bearer ${jwtToken}` },
                  })
                  .then((res) => {
                    successCnt++
                  })
                  .catch((error) => {
                    this.logger_.error(error)
                    errorRecords.push(item)
                  })
              : await axiosInstance
                  .post(path, _.omit(item, ['id', 'nickname']), {
                    headers: { Authorization: `Bearer ${jwtToken}` },
                  })
                  .then((res) => {
                    successCnt++
                  })
                  .catch((error) => {
                    this.logger_.error(error)
                    errorRecords.push(item)
                  })
          }

          this.logger_.info('Total records failed: ' + errorRecords.length)
          for (const item of errorRecords) {
            this.logger_.error('fail:', `[${item.id}][${item.name}]`)
          }

          await this.batchJobService_.update(batchJobId, {
            result: {
              advancement_count: successCnt,
              medatadata: {
                fail_records: errorRecords.map((item) =>
                  _.pick(item, ['id', 'name']),
                ),
              },
              stat_descriptors: [
                {
                  key: 'fail_count',
                  name: 'Number of stores failed to import',
                  message: `Failed to import ${errorRecords.length} stores from csv file`,
                },
                {
                  key: 'success_count',
                  name: 'Number of stores successfully imported',
                  message: `${successCnt} stores successfully imported`,
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

export default StoreImportStrategy
