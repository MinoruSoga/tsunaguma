import { AbstractBatchJobStrategy, BatchJobService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import Papa from 'papaparse'
import { EntityManager, In } from 'typeorm'

import { getCustomerId, UserTypeDisplay } from '../helpers/display_id'
import { NotificationSettingService } from '../modules/notification/services/notification-setting.service'
import { OrderService } from '../modules/order/services/order.service'
import { ProductReviewsService } from '../modules/product/services/product-reviews.service'
import { UploadService } from '../modules/upload/upload.service'
import { GetListUserBody } from '../modules/user/controllers/get-user-list.cms.admin.controller'
import { User, UserStatus } from '../modules/user/entity/user.entity'
import UserService from '../modules/user/services/user.service'
import { UserSearchService } from '../modules/user/services/user-search.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  userService: UserService
  uploadService: UploadService
  logger: Logger
  orderService: OrderService
  notificationSettingService: NotificationSettingService
  productReviewsService: ProductReviewsService
  userSearchService: UserSearchService
}

type CsvLine = {
  顧客ID: string // id
  無効フラグ: boolean // invalid flag
  顧客種別: string // Customer Type
  姓: string // Last name
  名: string // First Name
  セイ: string
  メイ: string
  ニックネーム: string // Nickname
  性別: string // Gender
  生年月日: string // Date of birth
  メールアドレス: string // Email Address
  電話番号: string // Phone Number
  郵便番号: string // Postal code
  都道府県: string // State/Province
  市区町村名: string // City/Town/Village
  '建物名・部屋番号': string // Building Name/Room Number
  保有ポイント: number // Points held
  メルマガ登録状況: boolean //Newsletter Registration Status
  メールアドレス不明フラグ: string
  総利用金額: number //Total Amount Used
  購入回数: number // Number of purchases
  最終利用日: Date // Date of last use
  返品回数: string // Number of returns
  返品額: string // Returned product amount
  レビュー件数: number //Number of Reviews
}

class CustomerExportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'export-customer-strategy'
  static batchType = 'export-customer'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected userService_: UserService
  protected uploadService_: UploadService
  protected logger_: Logger
  protected orderService_: OrderService
  protected notiSettingService: NotificationSettingService
  protected productReviewsService_: ProductReviewsService
  protected userSearchService_: UserSearchService

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.userService_ = container.userService
    this.uploadService_ = container.uploadService
    this.logger_ = container.logger
    this.orderService_ = container.orderService
    this.notiSettingService = container.notificationSettingService
    this.productReviewsService_ = container.productReviewsService
    this.userSearchService_ = container.userSearchService
  }

  async preProcessBatchJob(batchJobId: string): Promise<void> {
    const batchJob = await this.batchJobService_.retrieve(batchJobId)

    const searchParams = (batchJob.context?.searchParams ??
      {}) as GetListUserBody
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const config = (batchJob.context?.config ?? {}) as FindConfig<User>

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [users, count] = await this.userSearchService_.seachCustomer({
      ...searchParams,
      ...config,
    } as GetListUserBody)
    const ids = (users || []).map((user) => user.id)
    batchJob.context.customerIds = ids

    await this.batchJobService_.update(batchJob, {
      result: {
        advancement_count: 0,
        count: users.length,
        stat_descriptors: [
          {
            key: 'customer-export-count',
            name: 'Number of customers to export',
            message: `${users.length} customer(s) will be exported.`,
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

      const usersIds = (batchJob.context.customerIds || []) as string[]

      const [users, count] = await this.userService_
        .withTransaction(transactionManager)
        .listUser(
          { id: In(usersIds) },
          {
            relations: ['customer', 'store'],
          },
        )

      for (let i = 0; i < users.length; i++) {
        const total = await this.orderService_
          .withTransaction(transactionManager)
          .getTotalAmountOrder(users[i].id)

        const totalPurchases = await this.orderService_
          .withTransaction(transactionManager)
          .getTotalPurchases(users[i].id)

        const notiSetting = await this.notiSettingService
          .withTransaction(transactionManager)
          .retrieve_(users[i].id)

        const totalReviews = await this.productReviewsService_
          .withTransaction(transactionManager)
          .getTotalReviews(users[i].id)

        users[i].total_amount = total[0]?.total_amount || 0
        users[i].notificationSettings = notiSetting || null
        users[i].total_purchases = totalPurchases || 0
        users[i].total_reviews = totalReviews || 0
      }

      const csvLines: CsvLine[] = []
      for (const user of users) {
        csvLines.push({
          顧客ID: getCustomerId(user.customer?.display_id),
          無効フラグ: user.status !== UserStatus.ACTIVE,
          顧客種別: UserTypeDisplay[user.type],
          姓: user.first_name,
          名: user.last_name,
          セイ: '',
          メイ: '',
          ニックネーム: user.nickname,
          性別: '',
          生年月日: '',
          メールアドレス: user.email,
          電話番号: user.address?.phone,
          郵便番号: user.address?.postal_code,
          都道府県: user.address?.prefecture?.name,
          市区町村名: user.address?.address_1,
          '建物名・部屋番号': user.address?.address_2,
          保有ポイント: user.point?.['total'],
          メルマガ登録状況: user.notificationSettings?.is_newletter,
          メールアドレス不明フラグ: '',
          総利用金額: user.total_amount || 0,
          購入回数: user.total_purchases,
          最終利用日: user.latest_used_at,
          返品回数: '0',
          返品額: '0',
          レビュー件数: user.total_reviews,
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

export default CustomerExportStrategy
