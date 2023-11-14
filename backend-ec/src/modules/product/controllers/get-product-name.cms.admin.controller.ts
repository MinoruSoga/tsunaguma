import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { ProductService } from '../services/product.service'

/**
 * @oas [post] /get-product-name/cms
 * operationId: "GetProductNameCms"
 * summary: "get product by display_id or product_code cms"
 * description: "get product by display_id or product_code cms"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/GetProductNameCms"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          properties:
 *             product:
 *               $ref: "#/components/schemas/GetProductNameCmsRes"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */

const getProductNameCmsAdminController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const productService: ProductService = req.scope.resolve('productService')
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const validated = await validator(GetProductNameCms, req.body)

  const product = await productService.getProductName(validated)
  res.status(200).json({ product })
}

export default getProductNameCmsAdminController

/**
 * @schema GetProductNameCms
 * title: "Get product name cms request body"
 * description: "Get product name cms request body"
 * x-resourceId: GetProductNameCms
 * properties:
 *  display_id:
 *    type: number
 *  display_code:
 *    type: string
 */
export class GetProductNameCms {
  @IsNumber()
  @IsOptional()
  display_id?: number

  @IsString()
  @IsOptional()
  display_code?: string
}

/**
 * @schema GetProductNameCmsRes
 * title: "Get product name cms response"
 * description: "Get product name cms response"
 * x-resourceId: GetProductNameCmsRes
 * properties:
 *  id:
 *    type: string
 *  title:
 *    type: string
 *  display_id:
 *    type: number
 *  display_code:
 *    type: string
 */
export type GetProductNameCmsRes = {
  id: string
  title: string
  display_id: number
  display_code: string
}
