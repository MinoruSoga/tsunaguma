import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsOptional, IsString } from 'class-validator'
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
 * @oas [put] /product-material/{id}
 * operationId: "PutProductMaterial"
 * summary: "Put Product Material"
 * description: "Put a list of Product Material."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product material.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/PutProductMaterialBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-material
 * responses:
 *   "200":
 *     description: Ok
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
const updateMaterialController = async (
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

  const id = req.params.id
  const validated = await validator(PutProductMaterialBody, req.body)
  const raw = await productMaterialService.update(id, validated)
  const material = _.pick(raw, defaultProductMaterialFields)
  res.status(200).json(material)
}

export default updateMaterialController

/**
 * @schema PutProductMaterialBody
 * title: "PutProductMaterialBody"
 * description: "Put product-material body"
 * x-resourceId: PutProductMaterialBody
 * type: object
 * properties:
 *   name:
 *     type: string
 *   type_id:
 *     type: string
 */
export class PutProductMaterialBody {
  @IsString()
  @IsOptional()
  name: string

  @IsString()
  @IsOptional()
  type_id: string
}
