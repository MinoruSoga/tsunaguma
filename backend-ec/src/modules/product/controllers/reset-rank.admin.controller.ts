import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import loadConfig from '../../../helpers/config'
import { ProductSortService } from '../services/product-sort.service'

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const config = loadConfig()
  const apiKey = req.headers['x-api-key']

  const productSortService = req.scope.resolve<ProductSortService>(
    ProductSortService.resolutionKey,
  )

  if (!apiKey || apiKey !== config.meiliSearch.resetKey) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  const data = await validator(ResetRankReq, req.body)

  await productSortService.resetRank(data.type, data.store_ids)

  res.sendStatus(200)
}

class ResetRankReq {
  @IsEnum(['all', 'store'], {
    always: true,
    message: `Invalid value (Reset type must be one of following values: ${Object.values(
      ['all', 'store'],
    ).join(', ')})`,
  })
  type: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  store_ids: string[]
}
