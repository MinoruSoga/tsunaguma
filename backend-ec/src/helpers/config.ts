import { LogLevelType } from 'winston'

export type ExtendedConfig = {
  serverConfig: {
    port: number
  }
  email: {
    email_from: string
    email_from_name: string
    sendgrid_api_key: string
    email_admin: string
  }
  pusher: {
    pusher_app_id: string
    pusher_app_key: string
    pusher_secret: string
    pusher_cluster: string
    pusher_encrypted: boolean
  }
  frontendUrl: {
    base: string
    register: (token: string) => string
    requestResetPassword: (token: string) => string
    productDetail: (id: string) => string
    login: string
    contact: string
    purchaseHistory: string
    pointList: string
    purchaseHistoryDetail: (id: string) => string
    transactionHistoryDetail: (id: string) => string
    purchaseReview: (id: string) => string
    searchProductByCategory: (id: string) => string
    shopDetailProfile: (id: string) => string
    shopDetailReview: (id: string) => string
    follows: (tab: string) => string
    chattingThread: (id: string) => string
    editProduct: (id: string) => string
    customerReview: (id: string) => string
    favorites: string
    photoService: string
    returnGuaranteeService: string
    inquiry: string
  }
  awsS3: {
    privateBucket: string
    publicBucket: string
    region: string
    endpoint: string
  }
  meiliSearch: {
    host: string
    apiKey: string
    resetKey: string
  }
  gmo: {
    siteID: string
    sitePass: string
    shopID: string
    shopPass: string
    baseUrl: string
  }
  projectConfig: {
    cookie_secret: string
    redis_url: string
  }
  cache: {
    productColors: string
    productMaterials: (config?: any) => string
    productTypes: (config: any) => string
    productSpecs: (config?: any) => string
    productSizes: (config?: any) => string
    prefectures: (config?: any) => string
    totalPoint: (userId: string) => string
  }
  app: {
    deletedStatusFlag: boolean
  }
  winston: {
    enabled: boolean
    console: {
      level: LogLevelType
    }
    file: {
      level: LogLevelType
      maxsize: number | string
      maxFiles: number | string
    }
  }
}

let config: ExtendedConfig = undefined

export default function loadConfig(): ExtendedConfig {
  if (!config) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    config = require('../../medusa-config.js')
  }

  return config
}
