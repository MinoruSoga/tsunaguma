/* eslint-disable @typescript-eslint/ban-ts-comment */
import { defaultAdminProductRelations } from '@medusajs/medusa'
import { Selector } from '@medusajs/medusa/dist/types/common'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'
import { In, Not } from 'typeorm'

import { JAPANESE_CURRENCY_CODE } from '../../../helpers/constant'
import { notAllowedGetMyProductStatuses } from '../constant'
import { Product } from '../entity/product.entity'
import { PriceListService } from '../services/price-list.service'
import { ProductService } from '../services/product.service'

/**
 * @oas [get] /myproduct/{id}
 * operationId: "GetMyProductDetail"
 * summary: "Get a My Product detail"
 * description: "Retrieves a my Product detail."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *               $ref: "#/components/schemas/product"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */

const productRelations = defaultAdminProductRelations
  .filter((rel) => rel !== 'images')
  .concat([
    'ship_from',
    'product_specs',
    'product_images',
    'product_images.image',
    'product_addons',
    'product_colors',
    'product_shipping_options',
  ])

function orderByRank<T extends { rank: number }>(a: T, b: T) {
  return a.rank - b.rank
}

export default async (req: MedusaRequest, res: Response) => {
  const { id } = req.params

  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  const productService: ProductService = req.scope.resolve('productService')
  const priceListService: PriceListService =
    req.scope.resolve('priceListService')

  req.retrieveConfig = req.retrieveConfig ?? {}

  const relations = req.retrieveConfig.relations || productRelations

  const product = (await productService.retrieve_(
    {
      id,
      store_id: loggedInUser.store_id,
      status: Not(In(notAllowedGetMyProductStatuses)),
    } as Selector<Product>,
    {
      currency_code: JAPANESE_CURRENCY_CODE,
      relations,
    },
  )) as Product

  // temp filter deleted variants
  if (product.variants?.length) {
    product.variants = product.variants.filter((v) => !v.is_deleted)
  }

  // add priceList
  const priceListId = product?.variants[0]?.prices?.filter(
    (price) => !!price.price_list_id,
  )[0]?.price_list_id
  if (priceListId) {
    const priceList = await priceListService.retrieve_(priceListId)
    if (priceList) {
      product.variants.forEach((variant) => {
        variant.prices.forEach((price) => {
          if (!!price.price_list_id) {
            price.price_list = priceList
          }
        })
      })
    }
  }

  // sort by rank
  if (product.product_images?.length) {
    product.product_images = product.product_images.sort(orderByRank)
    product.images = product.product_images.map(({ image }) => image)
  }
  if (product.product_specs?.length) {
    product.product_specs = product.product_specs.sort(orderByRank)
  }
  if (product.product_addons?.length) {
    product.product_addons = product.product_addons.sort(orderByRank)
  }
  if (product.product_colors?.length) {
    product.product_colors = product.product_colors.sort(orderByRank)
  }
  if (product.product_shipping_options?.length) {
    product.product_shipping_options =
      product.product_shipping_options.sort(orderByRank)
  }

  res.json(product)
}
