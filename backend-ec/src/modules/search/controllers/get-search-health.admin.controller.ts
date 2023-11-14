import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { ProductSearchService } from '../services/product-search.service'

const getSearchHealthController = async (req: MedusaRequest, res: Response) => {
  const searchService: ProductSearchService = req.scope.resolve(
    'productSearchService',
  )
  const ret = await searchService.getSearchHealth()

  res.json(ret)
}

export default getSearchHealthController
