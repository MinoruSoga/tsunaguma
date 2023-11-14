import { ProductStatusEnum } from './entity/product.entity'

export const allowedProductFavoriteStatuses = [
  ProductStatusEnum.proposed,
  ProductStatusEnum.published,
]

export const notAllowedProductFavoriteStatuses = [
  ProductStatusEnum.deleted,
  ProductStatusEnum.draft,
  ProductStatusEnum.rejected,
  ProductStatusEnum.delivery_request,
]

export const notAllowedGetMyProductStatuses = [
  ProductStatusEnum.deleted,
  ProductStatusEnum.delivery_request,
]
