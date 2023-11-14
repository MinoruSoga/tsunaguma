import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../../helpers/constant'
import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { isAdmin } from '../../../../modules/user/constant'
import { ProductSpecService } from '../../services/product-spec.service'
import { defaultProductSpecFields } from './product-spec-list.admin.controller'

/**
 * @oas [put] /product-spec/{id}
 * operationId: "PutProductSpec"
 * summary: "Put Product Spec"
 * description: "Post a list of Product Spec."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Product spec.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/PutProductSpecBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-spec
 * responses:
 *   "200":
 *     description: Ok
 *     content:
 *      application/json:
 *        schema:
 *          $ref: "#/components/schemas/product_spec"
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
const updateSpecController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const productSpecService = req.scope.resolve(
    'productSpecService',
  ) as ProductSpecService

  const id = req.params.id
  const validated = await validator(PutProductSpecBody, req.body)
  const raw = await productSpecService.update(id, validated)
  const spec = _.pick(raw, defaultProductSpecFields)
  res.status(200).json(spec)
}

export default updateSpecController

/**
 * @schema PutProductSpecBody
 * title: "PutProductSpecBody"
 * description: "Put product-spec body"
 * x-resourceId: PutProductSpecBody
 * type: object
 * properties:
 *   name:
 *     type: string
 *   product_type_id:
 *     type: string
 *   parent_id:
 *     type: string
 *   is_free:
 *     type: boolean
 */
export class PutProductSpecBody {
  @IsString()
  @IsOptional()
  name: string

  @IsString()
  @IsOptional()
  product_type_id: string

  @IsBoolean()
  @IsOptional()
  is_free?: boolean

  @IsString()
  @IsOptional()
  parent_id?: string
}
