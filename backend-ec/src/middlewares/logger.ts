import { Express } from 'express'
import morgan from 'morgan'

import logger from '../config/winston'

export default async function loggerMiddleware(app: Express) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  app.use(morgan('combined', { stream: logger.stream }))
}
