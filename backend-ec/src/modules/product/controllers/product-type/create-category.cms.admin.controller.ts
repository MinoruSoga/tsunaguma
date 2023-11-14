import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import { ProductTypeService } from '../../services/product-type.service'
import { defaultProductTypeFields } from './category-product.admin.controller'

/**
 * @oas [post] /product-type
 * operationId: "PostProductType"
 * summary: "Post Product Type"
 * description: "Post a list of Product Type."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/PostProductTypeBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-type
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *      application/json:
 *        schema:
 *          $ref: "#/components/schemas/product_type"
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
const createCategoryController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const productTypeService = req.scope.resolve(
    'productTypeService',
  ) as ProductTypeService

  const validated = await validator(PostProductTypeBody, req.body)
  const raw = await productTypeService.create(validated)
  const types = _.pick(raw, defaultProductTypeFields)
  res.status(201).json(types)
}

export default createCategoryController

/**
 * @schema PostProductTypeBody
 * title: "PostProductTypeBody"
 * description: "Post product-type body"
 * x-resourceId: PostProductTypeBody
 * type: object
 * required:
 *   - value
 * properties:
 *   parent_id:
 *     type: string
 *   value:
 *     type: string
 */
export class PostProductTypeBody {
  @IsString()
  value: string

  @IsString()
  @IsOptional()
  parent_id?: string
}
