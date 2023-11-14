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
 * @oas [put] /product-type/{id}
 * operationId: "PutProductType"
 * summary: "Put Product Type"
 * description: "Put a list of Product Type."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product type.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/PutProductTypeBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-type
 * responses:
 *   "200":
 *     description: OK
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
const updateCategoryController = async (
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

  const id = req.params.id
  const validated = await validator(PutProductTypeBody, req.body)
  const raw = await productTypeService.update(id, validated)
  const types = _.pick(raw, defaultProductTypeFields)
  res.status(200).json(types)
}

export default updateCategoryController

/**
 * @schema PutProductTypeBody
 * title: "PutProductTypeBody"
 * description: "Put product-type body"
 * x-resourceId: PutProductTypeBody
 * type: object
 * properties:
 *   parent_id:
 *     type: string
 *   value:
 *     type: string
 */
export class PutProductTypeBody {
  @IsOptional()
  @IsString()
  value: string

  @IsString()
  @IsOptional()
  parent_id?: string
}
