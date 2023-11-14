import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import { ProductMaterialService } from '../../services/product-material.service'
import { defaultProductMaterialFields } from './product-material-list.admin.controller'

/**
 * @oas [post] /product-material
 * operationId: "PostProductMaterial"
 * summary: "Post Product Material"
 * description: "Post a list of Product Material."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/PostProductMaterialBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-material
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *      application/json:
 *        schema:
 *          $ref: "#/components/schemas/product_material"
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
const createMaterialController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const productMaterialService = req.scope.resolve(
    'productMaterialService',
  ) as ProductMaterialService

  const validated = await validator(PostProductMaterialBody, req.body)
  const raw = await productMaterialService.create(validated)
  const material = _.pick(raw, defaultProductMaterialFields)
  res.status(201).json(material)
}

export default createMaterialController

/**
 * @schema PostProductMaterialBody
 * title: "PostProductMaterialBody"
 * description: "Post product-material body"
 * x-resourceId: PostProductMaterialBody
 * type: object
 * required:
 *   - value
 *   - type_id
 * properties:
 *   name:
 *     type: string
 *   type_id:
 *     type: string
 */
export class PostProductMaterialBody {
  @IsString()
  name: string

  @IsString()
  type_id: string
}
