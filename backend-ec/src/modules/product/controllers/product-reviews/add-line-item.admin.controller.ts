/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import loadConfig from '../../../../helpers/config'
import { ProductReviewsService } from '../../services/product-reviews.service'

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const productReviewsService = req.container.resolve<ProductReviewsService>(
    ProductReviewsService.resolutionKey,
  )
  const config = loadConfig()

  const apiKey = req.headers['x-api-key']
  if (!apiKey || apiKey !== config.meiliSearch.resetKey) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  await productReviewsService.addLineItemToReview()

  res.sendStatus(200)
}
