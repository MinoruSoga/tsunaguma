import { Express } from 'express'

type Options = {
  app: Express
}

export default async ({ app }: Options): Promise<Express> => {
  // let sameSite: string | boolean = false
  // let secure = false
  // if (
  //   process.env.NODE_ENV === 'production' ||
  //   process.env.NODE_ENV === 'staging'
  // ) {
  //   secure = true
  //   sameSite = 'none'
  // }

  // const { cookie_secret } = configModule.projectConfig
  // const sessionOpts = {
  //   resave: true,
  //   saveUninitialized: true,
  //   cookieName: 'session',
  //   proxy: true,
  //   secret: cookie_secret,
  //   cookie: {
  //     sameSite,
  //     secure,
  //     maxAge: 10 * 60 * 60 * 1000,
  //   },
  //   store: null,
  // }

  // if (configModule?.projectConfig?.redis_url) {
  //   const RedisStore = createStore(session)
  //   const redisClient = redis.createClient(configModule.projectConfig.redis_url)
  //   sessionOpts.store = new RedisStore({ client: redisClient })
  // }

  // app.set('trust proxy', 1)
  // app.use(
  //   morgan('combined', {
  //     skip: () => process.env.NODE_ENV === 'test',
  //   }),
  // )
  // app.use(cookieParser())
  // app.use(session(sessionOpts))

  app.get('/health', (req, res) => {
    res.status(200).send('OK')
  })

  return app
}
