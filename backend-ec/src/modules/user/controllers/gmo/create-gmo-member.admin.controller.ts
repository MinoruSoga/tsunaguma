import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { GmoService } from '../../services/gmo.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'
import { LoggedInUser } from './../../../../interfaces/loggedin-user'

/**
 * @oas [post] /users/gmo-member
 * operationId: "CreateGmoMember"
 * summary: "Create gmo member"
 * description: "Create gmo member"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/SaveGmoMemberParams"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User
 * responses:
 *   "200":
 *    description: OK
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
export default async (req: MedusaRequest, res: Response) => {
  const gmoService: GmoService = req.scope.resolve(GmoService.resolutionKey)
  const data = await validator(SaveMemberParams, req.body)

  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  await gmoService.saveGmoMember(loggedInUser.id, data)

  res.sendStatus(200)
}

/**
 * @schema SaveGmoMemberParams
 * title: "SaveGmoMemberParams"
 * description: "Save GMO member Params"
 * x-resourceId: SaveGmoMemberParams
 * type: object
 * required:
 *   - token
 * properties:
 *  member_name:
 *    type: string
 *    description: get member name
 *    example: name
 *  token:
 *    type: string
 *    description: get token
 *    example: df2a3853ed963fbb31d64131468073a8
 */
export class SaveMemberParams {
  @IsString()
  @IsOptional()
  member_name?: string

  @IsString()
  token: string
}
