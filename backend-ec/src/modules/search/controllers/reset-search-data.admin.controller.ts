/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EventBusService } from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { SearchService } from 'medusa-interfaces'
import { In } from 'typeorm'

import loadConfig from '../../../helpers/config'
import { ProductService } from '../../product/services/product.service'
import { ProductSearchService } from '../services/product-search.service'

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const config = loadConfig()
  const apiKey = req.headers['x-api-key']
  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService
  const searchService = req.scope.resolve<SearchService>('searchService')
  const productService = req.scope.resolve<ProductService>('productService')
  const data = await validator(ResetSearchReq, req.body)

  if (!apiKey || apiKey !== config.meiliSearch.resetKey) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  if (data.clear_all) {
    // clear all search documents before reset data
    await searchService.deleteAllDocuments(ProductService.CUSTOM_INDEX_NAME)
  } else if (data.store_ids?.length || data.product_ids?.length) {
    const products = await productService.list({
      id: In(data.product_ids ?? []),
    })

    const storeProducts = await productService.list({
      // @ts-ignore
      store_id: In(data.store_ids ?? []),
    })

    await Promise.all(
      [...products, ...storeProducts].map(async (product) => {
        await searchService.deleteDocument(
          ProductService.CUSTOM_INDEX_NAME,
          product.id,
        )
      }),
    )
  }

  await eventBusService.emit(ProductSearchService.TNG_SEARCH_INDEX_EVENT, {})

  res.sendStatus(200)
}

class ResetSearchReq {
  @IsBoolean()
  @IsOptional()
  clear_all?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  store_ids?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  product_ids?: string[]
}
