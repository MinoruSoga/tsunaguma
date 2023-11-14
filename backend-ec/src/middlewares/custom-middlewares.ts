import compression from 'compression'
import { Express } from 'express'
import helmet from 'helmet'

import loadConfig from '../helpers/config'
import customErrorHandler from './error-handler'
import applyLoggerMiddleware from './logger'

const config = loadConfig()

export default async function (app: Express) {
  // logger
  if (config.winston.enabled) {
    await applyLoggerMiddleware(app)
  }

  // compression
  app.use(helmet(), compression({ level: 6, threshold: 40 * 1000 }))

  // error handler
  const errorHandlerMiddleware = await import(
    '@medusajs/medusa/dist/api/middlewares/error-handler'
  )
  errorHandlerMiddleware.default = customErrorHandler
}
