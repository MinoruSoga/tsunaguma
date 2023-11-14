import { AdminPostProductsProductReq } from '@medusajs/medusa'
import { Validator } from 'medusa-extender'

import { ExtendedAdminPostProductReq } from './create-product.admin.controller'

/**
 * @oas [post] /products/{id}
 * operationId: "PostProductsProduct"
 * summary: "Update a Product"
 * x-authenticated: true
 * description: "Updates a Product"
 * parameters:
 *   - (path) id=* {string} The ID of the Product.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/ExtendedAdminPostProductReq"
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
 *           properties:
 *             product:
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

@Validator({ override: AdminPostProductsProductReq })
export class ExtendedAdminPostProductsProductReq extends ExtendedAdminPostProductReq {}
