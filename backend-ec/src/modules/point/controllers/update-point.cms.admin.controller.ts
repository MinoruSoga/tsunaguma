import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { PointService } from '../services/point.service'

/**
 * @oas [post] /point/history/cms
 * operationId: "UpdateUserPointHistoryCms"
 * summary: "Update User Point History Admin Cms"
 * description: "update point history for admin cms"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UpdatePointReq"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Point
 * responses:
 *  "200":
 *    description: OK
 *  "400":
 *     $ref: "#/components/responses/400_error"
 *  "404":
 *     $ref: "#/components/responses/not_found_error"
 *  "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *  "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *  "500":
 *     $ref: "#/components/responses/500_error"
 */
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const pointService = req.scope.resolve('pointService') as PointService
  const isUserAdmin = isAdmin(loggedInUser)

  const validated = await validator(UpdatePointReq, req.body)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  await pointService.updatePointCms(validated)

  res.sendStatus(200)
}

/**
 * @schema UpdatePointReq
 * title: "UpdatePointReq"
 * description: "Update point Req"
 * x-resourceId: UpdatePointReq
 * type: object
 * required:
 *   - point
 *   - user_id
 * properties:
 *   point:
 *     description: "The point for user"
 *     type: number
 *     example: prod_01GK6HJ9SX0VE59ZZATQCXACT2
 *   user_id:
 *     description: "usr_01GK6HJ9SX0VE59ZZATQCXACT2"
 *     type: string
 *     example: usr_01GK6HJ9SX0VE59ZZATQCXACT2
 */

export class UpdatePointReq {
  @IsNotEmpty()
  @IsNumber()
  point: number

  @IsNotEmpty()
  @IsString()
  user_id: string
}
