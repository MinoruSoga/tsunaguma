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
 * @oas [post] /product-spec
 * operationId: "PostProductSpec"
 * summary: "Post Product Spec"
 * description: "Post a list of Product Spec."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/PostProductSpecBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Product-spec
 * responses:
 *   "201":
 *     description: Created
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
const createSpecController = async (
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

  const validated = await validator(PostProductSpecBody, req.body)
  const raw = await productSpecService.create(validated)
  const spec = _.pick(raw, defaultProductSpecFields)
  res.status(201).json(spec)
}

export default createSpecController

/**
 * @schema PostProductSpecBody
 * title: "PostProductSpecBody"
 * description: "Post product-spec body"
 * x-resourceId: PostProductSpecBody
 * type: object
 * required:
 *   - name
 *   - product_type_id
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
export class PostProductSpecBody {
  @IsString()
  name: string

  @IsString()
  product_type_id: string

  @IsBoolean()
  @IsOptional()
  is_free?: boolean

  @IsString()
  @IsOptional()
  parent_id?: string
}
