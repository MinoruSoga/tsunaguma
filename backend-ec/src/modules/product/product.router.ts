import wrapHandler from '@medusajs/medusa/dist/api/middlewares/await-middleware'
import { transformQuery } from '@medusajs/medusa/dist/api/middlewares/transform-query'
import { Router } from 'medusa-extender'

import checkLikeStatusAdminController from './controllers/check-like-status.admin.controller'
import productListCms from './controllers/get-list-products.cms.admin.controller'
import getProductDetailController from './controllers/get-product-detail.admin.controller'
import getProductDetailAdCmsAdminController from './controllers/get-product-detail.cms.admin.controller'
import getProductNameCmsAdminController from './controllers/get-product-name.cms.admin.controller'
import getListSortProductsController, {
  defaultSortProductsFields,
  GetSortProductReq,
} from './controllers/get-sort-products.admin.controller'
import getTotalProductCategory from './controllers/get-total-product-follow-type.cms.admin.controller'
import myProductDetailController from './controllers/my-product-get-detail.admin.controller'
import myProductListbyStatusController, {
  defaultMyProductFields,
  MyProductsbyStatusParams,
} from './controllers/my-product-list-status.admin.controller'
import myProductTypeHsitoryListController, {
  defaultMyProductTypeHsitoryFields,
  MyProductTypeHsitoryParams,
} from './controllers/my-product-type-list-history.admin.controller'
import productColorController, {
  defaultProductColorFields,
  GetProductColorParams,
} from './controllers/product-color/product-color-list.admin.controller'
import productHistory, {
  defaultProductHistoryFields,
  GetProductHistoryCmsParams,
} from './controllers/product-history/get-product-history.cms.admin.controller'
import getProductHistoryDetailCmsAdminController from './controllers/product-history/get-product-history-detail-cms.admin.controller'
import productListByStoreController, {
  defaultProductByStoreFields,
  GetProductbyStoreParams,
} from './controllers/product-list-store.admin.controller'
import createMaterialController from './controllers/product-material/create-material.cms.admin.controller'
import deleteMaterialController from './controllers/product-material/delete-material.cms.admin.controller'
import productMaterialController, {
  defaultProductMaterialFields,
  GetProductMaterialParams,
} from './controllers/product-material/product-material-list.admin.controller'
import updateMaterialController from './controllers/product-material/update-material.cms.admin.controller'
import getProductOptionsList from './controllers/product-option/product-option-list.admin.controller'
import addLineItemAdminController from './controllers/product-reviews/add-line-item.admin.controller'
import fixReviewMessageAdminController from './controllers/product-reviews/fix-review-message.admin.controller'
import getListReviewStore, {
  GetReviewsStoreParams,
} from './controllers/product-reviews/get-list-review-store.admin.controller'
import getOrderDetailReview from './controllers/product-reviews/get-order-detail-review.admin.controller'
import getProductReviewsController, {
  defaultProductRelations,
  defaultProductReviewsFields,
  ProductReviewParams,
} from './controllers/product-reviews/get-product-reviews-controller.admin.controller'
import getReviewReply from './controllers/product-reviews/get-reply-review.admin.controller'
import getListProductReviews, {
  GetProductReviewsParams,
} from './controllers/product-reviews/get-reviewed-products.admin.controller'
import getTotalReviewStore, {
  GetTotalReviewsStoreParams,
} from './controllers/product-reviews/get-total-review-store.admin.controller'
import getTotalProductReview, {
  GetTotalProductReviewsParams,
} from './controllers/product-reviews/get-total-review-user.cms.admin.controller'
import productReviewListAdminController, {
  GetProductReviewsQueryPaginationParams,
} from './controllers/product-reviews/product-review-list.admin.controller'
import productReviewStoreController from './controllers/product-reviews/product-review-store.admin.controller'
import createReviewReply from './controllers/product-reviews/reply-review.admin.controller'
import updateOrderReview from './controllers/product-reviews/update-oder-review.admin.controller'
import productSizeListProductController, {
  defaultProductSizeFields,
  GetProductSizeParams,
} from './controllers/product-size/product-size-list.admin.controller'
import createSpecController from './controllers/product-spec/create-spec.cms.admin.controller'
import deleteSpecController from './controllers/product-spec/delete-spec.cms.admin.controller'
import productSpecController, {
  defaultProductSpecFields,
  GetProductSpecsParams,
} from './controllers/product-spec/product-spec-list.admin.controller'
import updateSpecController from './controllers/product-spec/update-spec.cms.admin.controller'
import categoryProductController, {
  defaultProductTypeFields,
  GetProductTypeParams,
} from './controllers/product-type/category-product.admin.controller'
import createCategoryController from './controllers/product-type/create-category.cms.admin.controller'
import deleteCategoryController from './controllers/product-type/delete-category.cms.admin.controller'
import updateCategoryController from './controllers/product-type/update-category.cms.admin.controller'
import resetRankAdminController from './controllers/reset-rank.admin.controller'
import restockRequestAdminController from './controllers/restock-request.admin.controller'
import setProductShippingMethodDefaultController, {
  SetProductShippingOptionParams,
} from './controllers/set-product-shipping-option.admin.controller'
import sortProductAdminController from './controllers/sort-product.admin.controller'
import updateStatusProducts from './controllers/update-status-product.admin.controller'

@Router({
  routes: [
    {
      requiredAuth: false,
      path: '/admin/product-types',
      method: 'get',
      handlers: [
        transformQuery(GetProductTypeParams, {
          defaultFields: defaultProductTypeFields,
        }),
        wrapHandler(categoryProductController),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/product-specs',
      method: 'get',
      handlers: [
        transformQuery(GetProductSpecsParams, {
          defaultFields: defaultProductSpecFields,
        }),
        wrapHandler(productSpecController),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/product-sizes',
      method: 'get',
      handlers: [
        transformQuery(GetProductSizeParams, {
          defaultFields: defaultProductSizeFields,
        }),
        wrapHandler(productSizeListProductController),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/product-colors',
      method: 'get',
      handlers: [
        transformQuery(GetProductColorParams, {
          defaultFields: defaultProductColorFields,
        }),
        wrapHandler(productColorController),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/product-materials',
      method: 'get',
      handlers: [
        transformQuery(GetProductMaterialParams, {
          defaultFields: defaultProductMaterialFields,
        }),
        wrapHandler(productMaterialController),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/product-addons/:id',
      method: 'get',
      handlers: [wrapHandler(getProductOptionsList)],
    },
    {
      requiredAuth: true,
      path: '/admin/myproduct-list-status',
      method: 'get',
      handlers: [
        transformQuery(MyProductsbyStatusParams, {
          defaultFields: defaultMyProductFields,
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(myProductListbyStatusController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/myproduct-type-list-history',
      method: 'get',
      handlers: [
        transformQuery(MyProductTypeHsitoryParams, {
          defaultFields: defaultMyProductTypeHsitoryFields,
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(myProductTypeHsitoryListController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/myproduct/:id',
      method: 'get',
      handlers: [wrapHandler(myProductDetailController)],
    },
    {
      requiredAuth: false,
      path: '/admin/product-list-store',
      method: 'get',
      handlers: [
        transformQuery(GetProductbyStoreParams, {
          defaultFields: defaultProductByStoreFields,
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(productListByStoreController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/myproducts/sort',
      method: 'get',
      handlers: [
        transformQuery(GetSortProductReq, {
          defaultFields: defaultSortProductsFields,
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getListSortProductsController),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/products/:id',
      method: 'get',
      handlers: [wrapHandler(getProductDetailController)],
    },
    {
      requiredAuth: true,
      path: '/admin/products/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getProductDetailAdCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/products/reviews/order',
      method: 'get',
      handlers: [
        transformQuery(GetProductReviewsQueryPaginationParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(productReviewListAdminController),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/products/:id/reviews',
      method: 'get',
      handlers: [
        transformQuery(ProductReviewParams, {
          defaultFields: defaultProductReviewsFields,
          defaultRelations: defaultProductRelations.concat(['variant.options']),
          isList: true,
          defaultLimit: 20,
        }),
        wrapHandler(getProductReviewsController),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/products/reviews',
      method: 'post',
      handlers: [wrapHandler(productReviewStoreController)],
    },
    {
      requiredAuth: true,
      path: '/admin/reviewed-products',
      method: 'get',
      handlers: [
        transformQuery(GetProductReviewsParams, {
          isList: true,
          defaultLimit: 10,
          defaultRelations: defaultProductRelations.concat(['variant.options']),
        }),
        wrapHandler(getListProductReviews),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/products/update-status',
      method: 'put',
      handlers: [wrapHandler(updateStatusProducts)],
    },
    {
      requiredAuth: true,
      path: '/admin/list-product-cms',
      method: 'post',
      handlers: [wrapHandler(productListCms)],
    },
    {
      requiredAuth: true,
      path: '/admin/product/:id/histories',
      method: 'get',
      handlers: [
        transformQuery(GetProductHistoryCmsParams, {
          defaultRelations: ['user'],
          defaultFields: defaultProductHistoryFields,
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(productHistory),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/product-reviews/:id/total',
      method: 'get',
      handlers: [
        transformQuery(GetTotalProductReviewsParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getTotalProductReview),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/product-reviews/:id/store',
      method: 'get',
      handlers: [
        transformQuery(GetTotalReviewsStoreParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(getTotalReviewStore),
      ],
    },
    {
      requiredAuth: false,
      path: '/admin/product/:id/category',
      method: 'get',
      handlers: [wrapHandler(getTotalProductCategory)],
    },
    {
      requiredAuth: false,
      path: '/admin/product-favorites',
      method: 'post',
      handlers: [wrapHandler(checkLikeStatusAdminController)],
    },
    {
      requiredAuth: false,
      path: '/admin/reviews/:id/store',
      method: 'get',
      handlers: [
        transformQuery(GetReviewsStoreParams, {
          isList: true,
          defaultLimit: 10,
          defaultRelations: defaultProductRelations.concat(['variant.options']),
        }),
        wrapHandler(getListReviewStore),
      ],
    },
    {
      requiredAuth: true,
      path: '/admin/product/shipping/default',
      method: 'get',
      handlers: [
        transformQuery(SetProductShippingOptionParams, {
          isList: true,
          defaultLimit: 10,
        }),
        wrapHandler(setProductShippingMethodDefaultController),
      ],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/products/sort',
      handlers: [wrapHandler(sortProductAdminController)],
    },
    {
      requiredAuth: true,
      method: 'put',
      path: '/admin/review/order',
      handlers: [wrapHandler(updateOrderReview)],
    },
    {
      requiredAuth: true,
      method: 'get',
      path: '/admin/review/order/:id',
      handlers: [wrapHandler(getOrderDetailReview)],
    },
    {
      requiredAuth: false,
      method: 'get',
      path: '/admin/review/reply/:id',
      handlers: [wrapHandler(getReviewReply)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/review/reply/:id',
      handlers: [wrapHandler(createReviewReply)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/review/sync-line-item',
      handlers: [wrapHandler(addLineItemAdminController)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/review/fix-message',
      handlers: [wrapHandler(fixReviewMessageAdminController)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/products/reset-rank',
      handlers: [wrapHandler(resetRankAdminController)],
    },
    {
      requiredAuth: true,
      method: 'post',
      path: '/admin/product/restock-request',
      handlers: [wrapHandler(restockRequestAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-type',
      method: 'post',
      handlers: [wrapHandler(createCategoryController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-type/:id',
      method: 'put',
      handlers: [wrapHandler(updateCategoryController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-type/:id',
      method: 'delete',
      handlers: [wrapHandler(deleteCategoryController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-material',
      method: 'post',
      handlers: [wrapHandler(createMaterialController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-material/:id',
      method: 'put',
      handlers: [wrapHandler(updateMaterialController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-material/:id',
      method: 'delete',
      handlers: [wrapHandler(deleteMaterialController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-spec',
      method: 'post',
      handlers: [wrapHandler(createSpecController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-spec/:id',
      method: 'put',
      handlers: [wrapHandler(updateSpecController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product-spec/:id',
      method: 'delete',
      handlers: [wrapHandler(deleteSpecController)],
    },
    {
      requiredAuth: true,
      path: '/admin/get-product-name/cms',
      method: 'post',
      handlers: [wrapHandler(getProductNameCmsAdminController)],
    },
    {
      requiredAuth: true,
      path: '/admin/product/history/:id/cms',
      method: 'get',
      handlers: [wrapHandler(getProductHistoryDetailCmsAdminController)],
    },
  ],
})
export class ProductRouter {}
