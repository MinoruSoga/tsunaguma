import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import loadConfig from '../../../helpers/config'
import { PointService } from '../services/point.service'

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const config = loadConfig()
  const apiKey = req.headers['x-api-key']

  const pointService = req.scope.resolve<PointService>(
    PointService.resolutionKey,
  )

  if (!apiKey || apiKey !== config.meiliSearch.resetKey) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  await pointService.initPoint()

  res.sendStatus(200)
}
