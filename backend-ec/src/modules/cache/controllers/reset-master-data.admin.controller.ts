import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsArray, IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import loadConfig from '../../../helpers/config'
import { CacheService } from '../cache.service'

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const config = loadConfig()
  const apiKey = req.headers['x-api-key']
  const cacheService = req.scope.resolve<CacheService>(
    CacheService.resolutionKey,
  )

  const data = await validator(ClearCacheReq, req.body)

  if (!apiKey || apiKey !== config.meiliSearch.resetKey) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  await cacheService.clearCache(data.patterns || [])

  res.sendStatus(200)
}

class ClearCacheReq {
  @IsOptional()
  @IsArray()
  patterns: string[]
}
