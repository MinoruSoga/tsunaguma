import { AbstractBatchJobStrategy, BatchJobService } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import Papa from 'papaparse'
import { EntityManager } from 'typeorm'

import StoreService from './../modules/store/services/store.service'
import { UploadService } from './../modules/upload/upload.service'

type InjectedDependencies = {
  manager: EntityManager
  batchJobService: BatchJobService
  storeService: StoreService
  uploadService: UploadService
  logger: Logger
}

export type CsvLine = {
  店舗ID: string //	Store ID
  メールアドレス: string //	Email Address
  ニックネーム: string //	Nickname
  ショップ名: string // store name
  出店タイプ: string //	Store opening type
  事業形態: string //	Business Type
  氏名: string //	Full name
  lastname: string // Last name
  '氏名（ふりがな）': string //	Full name
  last_name_kana: string //	last name kana
  法人団体名: string //	Corporate Organization Name
  '法人団体名（ふりがな）': string //	Corporate Organization Name
  郵便番号: string //	Postal code
  都道府県: string //	State/Province
  '市区町村名・番地': string //	City/town/village
  '建物名・部屋番号': string //	Building name and room number
  電話番号: string //	Telephone number
  携帯番号: string //	Cell phone number
  緊急連絡先: string //	Emergency Contact
  代表者氏名: string // 	Name of Representative
  代表者氏名_last_name: string // 	Name of Representative
  '代表者氏名（ふりがな）': string //	Representative's Name
  '代表者氏名（ふりがな）last name': string //	Representative's Name
  性別: string //	Gender
  生年月日: string //	Date of birth
  会社WebサイトURL: string //	Company Website URL
  担当者氏名: string //	Contact person's name
  Contact_last_name: string // Contact person's last name
  '担当者氏名（ふりがな）': string //	Contact person's name
  contact_lastname_kana: string
  担当者電話番号: string //	Contact person's phone number
  紹介コード: string //	Referral Code
  '法人名または屋号（正式名称）': string //	Company name or trade name (official name)
  登録番号: string //	Registration Number
  支払方法: string //	Payment Method
  銀行名: string //	Bank Name
  銀行番号: string //	Bank No.
  支店名: string //	Branch name
  支店番号: string //	Branch No.
  口座種別: string //	Account Type
  口座番号: string //	Account No.
  口座名義人: string //	Account Holder
  基本マージン率: number //	Basic Margin Rate
  特別マージン率: number //	Special Margin Rate
  特別マージン設定期間開始日: string //	Special Margin Setting Period Start Date
  特別マージン設定期間終了日: string //	Special Margin Setting Period End Date
}

class StoreExportStrategy extends AbstractBatchJobStrategy {
  static identifier = 'export-store-strategy'
  static batchType = 'export-store'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  protected batchJobService_: BatchJobService
  protected storeService_: StoreService
  protected uploadService_: UploadService
  protected logger_: Logger

  constructor(container: InjectedDependencies) {
    super(container)

    this.manager_ = container.manager
    this.batchJobService_ = container.batchJobService
    this.storeService_ = container.storeService
    this.uploadService_ = container.uploadService
    this.logger_ = container.logger
  }

  async processJob(batchJobId: string): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const csvLines: CsvLine[] = []
      csvLines.push({
        店舗ID: '',
        メールアドレス: 'sample1@kimono-365.co.jp',
        ニックネーム: 'sample1',
        ショップ名: 'つくつな',
        出店タイプ: 'standard',
        事業形態: 'personal',
        氏名: '山田',
        lastname: '太朗',
        '氏名（ふりがな）': 'やまだ',
        last_name_kana: 'たろう',
        法人団体名: '',
        '法人団体名（ふりがな）': '',
        郵便番号: '111-1111-1111',
        都道府県: 'pref_1',
        '市区町村名・番地': '中央区湊1丁目12-10',
        '建物名・部屋番号': '八丁堀リバーゲート3階',
        電話番号: '111-1111-1111',
        携帯番号: '111-1111-1111',
        緊急連絡先: '山田太郎',
        代表者氏名: 'やまだ',
        代表者氏名_last_name: 'たろう',
        '代表者氏名（ふりがな）': '',
        '代表者氏名（ふりがな）last name': '', //	Representative's Name
        性別: 'male', //	Gender
        生年月日: '2023-01-01', //	Date of birth
        会社WebサイトURL: '', //	Company Website URL
        担当者氏名: '', //	Contact person's name
        Contact_last_name: '', // Contact person's last name
        '担当者氏名（ふりがな）': '', //	Contact person's name
        contact_lastname_kana: '',
        担当者電話番号: '', //	Contact person's phone number
        紹介コード: '', //	Referral Code
        '法人名または屋号（正式名称）': '', //	Company name or trade name (official name)
        登録番号: '', //	Registration Number
        支払方法: 'auto_pay', //	Payment Method
        銀行名: '', //	Bank Name
        銀行番号: '', //	Bank No.
        支店名: 'example', //	Branch name
        支店番号: '111', //	Branch No.
        口座種別: 'normal', //	Account Type
        口座番号: '1111111', //	Account No.
        口座名義人: 'example', //	Account Holder
        基本マージン率: 10, //	Basic Margin Rate
        特別マージン率: 5, //	Special Margin Rate
        特別マージン設定期間開始日: '2023-01-01', //	Special Margin Setting Period Start Date
        特別マージン設定期間終了日: '2023-01-02', //	Special Margin Setting Period End Date
      })

      csvLines.push({
        店舗ID: '',
        メールアドレス: 'sample2@kimono-365.co.jp',
        ニックネーム: 'sample2',
        ショップ名: 'つくつな',
        出店タイプ: 'prime',
        事業形態: 'company',
        氏名: '',
        lastname: '',
        '氏名（ふりがな）': '',
        last_name_kana: '',
        法人団体名: 'きもの３６５株式会社',
        '法人団体名（ふりがな）': 'きもの３６５かぶしきがいしゃ',
        郵便番号: '111-1111-1111',
        都道府県: 'pref_2',
        '市区町村名・番地': '中央区湊1丁目12-10',
        '建物名・部屋番号': '八丁堀リバーゲート3階',
        電話番号: '111-1111-1111',
        携帯番号: '111-1111-1111',
        緊急連絡先: '',
        代表者氏名: '山田',
        代表者氏名_last_name: '太郎',
        '代表者氏名（ふりがな）': 'やまだ', //	Representative's Name
        '代表者氏名（ふりがな）last name': 'たろう',
        性別: 'female', //	Gender
        生年月日: '2023-01-01', //	Date of birth
        会社WebサイトURL: 'https://www.kimono-365.jp/about/', //	Company Website URL
        担当者氏名: '山田', //	Contact person's name
        Contact_last_name: '太郎', // Contact person's last name
        '担当者氏名（ふりがな）': 'やまだ', //	Contact person's name
        contact_lastname_kana: 'たろう',
        担当者電話番号: '000000000', //	Contact person's phone number
        紹介コード: '11111111', //	Referral Code
        '法人名または屋号（正式名称）': 'きもの３６５株式会社', //	Company name or trade name (official name)
        登録番号: '12345', //	Registration Number
        支払方法: 'register', //	Payment Method
        銀行名: '', //	Bank Name
        銀行番号: '', //	Bank No.
        支店名: '', //	Branch name
        支店番号: '111', //	Branch No.
        口座種別: 'normal', //	Account Type
        口座番号: '1111111', //	Account No.
        口座名義人: 'example', //	Account Holder
        基本マージン率: 10, //	Basic Margin Rate
        特別マージン率: 5, //	Special Margin Rate
        特別マージン設定期間開始日: '2023-01-01', //	Special Margin Setting Period Start Date
        特別マージン設定期間終了日: '2023-01-02', //	Special Margin Setting Period End Date
      })

      await this.uploadService_
        .withTransaction(transactionManager)
        .uploadCsv(Papa.unparse(csvLines), batchJobId)
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

export default StoreExportStrategy
