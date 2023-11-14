import { IsOptional } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import UserService from '../services/user.service'
/**
 * @oas [get] /users/cms
 * operationId: "ListEmailCms"
 * summary: "List of email store"
 * description: "List of email store"
 * x-authenticated: true
 * parameters:
 *   - (query) limit=10 {integer} The number record of a page
 *   - (query) offset=0 {integer} The page of users
 *   - (query) order {string} Field used to order retrieved batch jobs
 *   - (query) expand {string} (Comma separated) Which fields should be expanded in each order of the result.
 *   - (query) fields {string} (Comma separated) Which fields should be included in each order of the result.
 * tags:
 *   - User
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  users:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/user"
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
 *
 */
const listEmailCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const userService: UserService = req.scope.resolve('userService')

  const users = await userService.listUserCms(
    req.filterableFields,
    req.listConfig,
  )

  res.status(200).json({ users: users })
}

export default listEmailCmsController

export class GetListUserCmsParams {
  @IsOptional()
  limit?: number

  @IsOptional()
  offset?: number

  @IsOptional()
  expand?: string

  @IsOptional()
  order?: string

  @IsOptional()
  fields?: string
}
