import { IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { StoreDetailService } from 'src/modules/store/services/store-detail.service'

import UserService from '../services/user.service'
/**
 * @oas [get] /user/{id}
 * operationId: "GetUserByid"
 * summary: "Get user by id"
 * description: "Get user by id"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The Id of user
 *   - (query) expand {string} The relations of user
 * tags:
 *   - User
 * responses:
 *   "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *          properties:
 *            user:
 *              $ref: "#/components/schemas/user"
 *            storeDetail:
 *              $ref: "#/components/schemas/store_detail"
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
const getUserController = async (req: MedusaRequest, res: Response) => {
  const userService: UserService = req.scope.resolve('userService')
  const storeDetailService: StoreDetailService =
    req.scope.resolve('storeDetailService')
  const { id } = req.params
  const user = await userService.retrieve(id, req.listConfig, false, true)
  const storeDetail = await storeDetailService.retrieveByUser(id, false)

  res.status(200).json({ user, storeDetail: storeDetail || {} })
}

export default getUserController

export class GetUserByIdParams {
  @IsString()
  @IsOptional()
  expand?: string
}
