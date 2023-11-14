const dotenv = require('dotenv')

let ENV_FILE_NAME = ''
switch (process.env.NODE_ENV) {
  case 'production':
    ENV_FILE_NAME = '.env.production'
    break
  case 'staging':
    ENV_FILE_NAME = '.env.staging'
    break
  case 'test':
    ENV_FILE_NAME = '.env.test'
    break
  case 'development':
  default:
    ENV_FILE_NAME = '.env'
    break
}

try {
  dotenv.config({ path: process.cwd() + '/' + ENV_FILE_NAME })
} catch (e) {}

// CORS when consuming Medusa from admin
const ADMIN_CORS =
  process.env.ADMIN_CORS || 'http://localhost:3000,http://localhost:3001'

// CORS to avoid issues when consuming Medusa from a client
const STORE_CORS =
  process.env.STORE_CORS || 'http://localhost:3000,http://localhost:3001'

// Database URL (here we use a local database called medusa-development)
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost/medusa-docker'
const DATABASE_LOGGING = process.env.DATABASE_LOGGING === 'true'

// Medusa uses Redis, so this needs configuration as well
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// security
const JWT_SECRET = process.env.JWT_SECRET || 'F24I2CTR=XUCKDx'
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'F24I2CTR=XUCKDx'

// meilisearch
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:8080'
const MEILISEARCH_API_KEY =
  process.env.MEILISEARCH_API_KEY || 'meilisearch-masterkey'
const MEILISEARCH_RESET_KEY =
  process.env.MEILISEARCH_RESET_KEY || 'bw5K0lXj2qCk7FXIjkfDkghjzyDoYkQZ'

// sentry
const SENTRY_DNS =
  process.env.SENTRY_DNS ||
  'https://635720916e864750b39b198e24f31390@o4504438869065728.ingest.sentry.io/4504438876798976'
const SENTRY_API_TOKEN =
  process.env.SENTRY_API_TOKEN ||
  '1498210913cd4f30a1b0ee3cfd6f8b09a791a825572b4915b7463a5c49723fb1'

// winston
const WINSTON_ENABLED =
  process.env.WINSTON_ENABLED || process.env.NODE_ENV === 'development'
const WINSTON_CONSOLE_LOG_LEVEL =
  process.env.WINSTON_CONSOLE_LOG_LEVEL || 'debug'
const WINSTON_FILE_LOG_LEVEL = process.env.WINSTON_FILE_LOG_LEVEL || 'debug'
const WINSTON_FILE_MAX_SIZE = process.env.WINSTON_FILE_MAX_SIZE || '10m'
const WINSTON_FILE_MAX_FILES = process.env.WINSTON_FILE_MAX_FILES || '30d'

// This is the place to include plugins. See API documentation for a thorough guide on plugins.
const plugins = [
  {
    resolve: `medusa-plugin-sentry`,
    options: {
      dsn: SENTRY_DNS,
      apiToken: SENTRY_API_TOKEN,
      integrations: (router, Sentry, Tracing) => {
        return [
          new Sentry.Integrations.Http({ tracing: true }),
          new Tracing.Integrations.Express({ router }),
        ]
      },
      tracesSampleRate: 1.0,
      enabled: process.env.NODE_ENV !== 'development',
      // webHookOptions: {
      //   path: '/sentry/webhook',
      //   secret: '__YOUR_SECRET__',
      //   emitOnIssue: true,
      //   emitOnError: false,
      //   emitOnComment: true,
      //   emitOnEventOrMetricAlert: true,
      //   emitOnInstallOrDeleted: false,
      // },
    },
  },
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `medusa-plugin-meilisearch`,
    options: {
      // config object passed when creating an instance of the MeiliSearch client
      config: {
        host: MEILISEARCH_HOST,
        apiKey: MEILISEARCH_API_KEY,
      },
      settings: {
        // index name
        tng_products: {
          // MeiliSearch's setting options to be set on a particular index
          searchableAttributes: [
            'search_string',
            'title',
            // 'description',
            // 'variant_sku',
            'store.name',
            'tags',
          ],
          displayedAttributes: [
            'id',
            'title',
            'description',
            'thumbnail',
            'handle',
            'store',
            'price',
            'created_at',
            'updated_at',
            'variant_sku',
            'like_cnt',
            'inventory_quantity',
            'in_stock',
            'is_return_guarantee',
            'has_gift_cover',
            'is_customizable',
            'sales_end_at',
            'sales_start_at',
            'sales_price',
            'display_code',
            'display_id',
            'tags',
            'search_string',
            'status',
            'is_free_shipping',
          ],
          filterableAttributes: [
            'type_id',
            'type_lv2_id',
            'id',
            'type_lv1_id',
            'material_id',
            'is_customizable',
            'gift_cover',
            'is_maker_ship',
            'store_id',
            'status',
            'product_colors',
            'has_gift_cover',
            'price',
            'inventory_quantity',
            'like_cnt',
            'store',
            'store.display_id',
            'store.plan_type',
            'in_stock',
            'is_return_guarantee',
            'sales_start_at_timestamp',
            'sales_end_at_timestamp',
            'display_code',
            'display_id',
            'tags',
            'is_free_shipping',
            'sales_price',
          ],
          sortableAttributes: [
            'id',
            'created_at',
            'updated_at',
            'inventory_quantity',
            'like_cnt',
          ],
          rankingRules: [
            'words',
            'sort',
            'typo',
            'proximity',
            'attribute',
            'exactness',
          ],
          pagination: {
            maxTotalHits: 50000,
          },
        },
      },
    },
  },
]

const PORT_NUMBER = parseInt(process.env.PORT_NUMBER || '9000', 10)

// email
const EMAIL_ADMIN = process.env.EMAIL_ADMIN || 'qpa.tester@gmail.com'
const EMAIL_FROM = process.env.EMAIL_FROM || 'hai.do@pionero.io'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || '【検証環境】つなぐま'
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

const PUSHER_APP_ID = process.env.PUSHER_APP_ID
const PUSHER_APP_KEY = process.env.PUSHER_APP_KEY
const PUSHER_SECRET = process.env.PUSHER_SECRET
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER

// frontend
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// aws s3
const PRIVATE_BUCKET = process.env.AWS_S3_PRIVATE_BUCKET
const PUBLIC_BUCKET = process.env.AWS_S3_PUBLIC_BUCKET
const AWS_S3_ENDPOINT =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4566'
    : process.env.AWS_ENDPOINT || undefined
const AWS_S3_REGION = process.env.AWS_REGION || 'ap-northeast-1'

//gmo
const GMO_SITE_ID = process.env.GMO_SITE_ID || 'tsite00049056'
const GMO_SITE_PASS = process.env.GMO_SITE_PASS || 'p8rvh758'
const GMO_SHOP_ID = process.env.GMO_SHOP_ID || 'tshop00058602'
const GMO_SHOP_PASS = process.env.GMO_SHOP_PASS || 'qhng2yf8'
const GMO_API_ENDPOINT =
  process.env.GMO_API_ENDPOINT || 'https://pt01.mul-pay.jp'

module.exports = {
  projectConfig: {
    redis_url: REDIS_URL,
    // For more production-like environment install PostgresQL
    database_url: DATABASE_URL,
    database_type: 'postgres',
    database_logging: DATABASE_LOGGING,
    // database_extra: {},
    store_cors: STORE_CORS,
    admin_cors: ADMIN_CORS,
    jwt_secret: JWT_SECRET,
    cookie_secret: COOKIE_SECRET,
    cli_migration_dirs: [
      'node_modules/external-module/dist/**/*.migration.js',
      'dist/**/*.migration.js',
    ],
  },
  plugins,
  serverConfig: {
    port: PORT_NUMBER,
  },
  monitoring: {
    uriPath: '/monitoring',
    authentication: true,
    onAuthenticate: function (req, username, password) {
      // simple check for username and password
      return username === 'tunaguma' && password === 'password'
    },
  },
  email: {
    email_admin: EMAIL_ADMIN,
    email_from: EMAIL_FROM,
    email_from_name: EMAIL_FROM_NAME,
    sendgrid_api_key: SENDGRID_API_KEY,
  },
  pusher: {
    pusher_app_id: PUSHER_APP_ID,
    pusher_app_key: PUSHER_APP_KEY,
    pusher_secret: PUSHER_SECRET,
    pusher_cluster: PUSHER_CLUSTER,
    pusher_encrypted: true,
  },
  frontendUrl: {
    base: FRONTEND_URL,
    register: (token) =>
      `${FRONTEND_URL}/register-certification?token=${token}`,
    requestResetPassword: (token) =>
      `${FRONTEND_URL}/reset-password?token=${token}`,
    login: `${FRONTEND_URL}/login`,
    contact: `${FRONTEND_URL}/contact`,
    productDetail: (id) => `${FRONTEND_URL}/product/${id}`,
    purchaseHistory: `${FRONTEND_URL}/purchases`,
    pointList: `${FRONTEND_URL}/points`,
    purchaseHistoryDetail: (id) => `${FRONTEND_URL}/purchases/${id}`,
    transactionHistoryDetail: (id) => `${FRONTEND_URL}/shop/transactions/${id}`,
    purchaseReview: (id) => `${FRONTEND_URL}/purchases/${id}/review`,
    searchProductByCategory: (id) => `${FRONTEND_URL}/listing/${id}`,
    shopDetailProfile: (id) => `${FRONTEND_URL}/shop-detail/${id}`,
    shopDetailReview: (id) => `${FRONTEND_URL}/shop-detail/${id}/review`,
    follows: (tab) => `${FRONTEND_URL}/follows?tab=${tab}`,
    chattingThread: (id) => `${FRONTEND_URL}/messages/${id}`,
    editProduct: (id) => `${FRONTEND_URL}/shop/product-register/${id}`,
    favorites: `${FRONTEND_URL}/favorites`,
    customerReview: (id) =>
      id ? `${FRONTEND_URL}/reviews?target=${id}` : `${FRONTEND_URL}/reviews`,
    photoService: `${FRONTEND_URL}/shop/settings/contract-information/photo-service`,
    returnGuaranteeService: `${FRONTEND_URL}/shop/settings/contract-information/return-guarantee`,
    inquiry: `${FRONTEND_URL}/contact`,
  },
  awsS3: {
    privateBucket: PRIVATE_BUCKET,
    publicBucket: PUBLIC_BUCKET,
    region: AWS_S3_REGION,
    endpoint: AWS_S3_ENDPOINT,
  },
  meiliSearch: {
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_API_KEY,
    resetKey: MEILISEARCH_RESET_KEY,
  },
  gmo: {
    siteID: GMO_SITE_ID,
    sitePass: GMO_SITE_PASS,
    shopID: GMO_SHOP_ID,
    shopPass: GMO_SHOP_PASS,
    baseUrl: GMO_API_ENDPOINT,
  },
  cache: {
    productColors: 'product-colors',
    productMaterials: (config) =>
      !config
        ? `product-materials`
        : `product-materials-${JSON.stringify(config)}`,
    productTypes: (config) => `product-types-${JSON.stringify(config)}`,
    productSpecs: (config) =>
      !config ? `product-specs` : `product-specs-${JSON.stringify(config)}`,
    productSizes: (config) =>
      !config ? `product-sizes` : `product-sizes-${JSON.stringify(config)}`,
    prefectures: (config) =>
      config ? `prefectures-${JSON.stringify(config)}` : 'prefectures',
    totalPoint: (userId) => `total_point-${userId}`,
  },
  app: {
    deletedStatusFlag: true,
  },
  winston: {
    enabled: WINSTON_ENABLED,
    console: {
      level: WINSTON_CONSOLE_LOG_LEVEL,
    },
    file: {
      level: WINSTON_FILE_LOG_LEVEL,
      maxsize: WINSTON_FILE_MAX_SIZE,
      maxFiles: WINSTON_FILE_MAX_FILES,
    },
  },
}
