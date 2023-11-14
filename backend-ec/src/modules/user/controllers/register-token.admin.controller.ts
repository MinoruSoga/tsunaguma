import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Transform } from 'class-transformer'
import { IsEmail } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import UserService from '../services/user.service'

/**
 * @oas [post] /users/register
 * operationId: "CreateUsersUserRegisterToken"
 * summary: "Request Register Account"
 * description: "Generates a register token for a User with a given email."
 * x-authenticated: false
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UserRegisterTokenReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User
 * responses:
 *   "204":
 *     description: OK
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
  const validated = await validator(UserRegisterTokenReq, req.body)

  const userService: UserService = req.scope.resolve('userService')
  const isExist = await userService.isEmailExist(validated.email)
  if (isExist) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      'Email is already exits',
    )
  }

  // Should call a email service provider that sends the token to the user
  const manager: EntityManager = req.scope.resolve('manager')
  await manager.transaction(async (transactionManager) => {
    return await userService
      .withTransaction(transactionManager)
      .generateRegisterToken(validated.email)
  })

  res.sendStatus(204)
}

/**
 * @schema UserRegisterTokenReq
 * title: "UserRegisterTokenReq"
 * description: "Request for Register Token"
 * x-resourceId: UserRegisterTokenReq
 * type: object
 * required:
 *   - email
 * properties:
 *  email:
 *    type: string
 *    format: email
 *    description: email for user
 *    example: 1@user.com
 */
export class UserRegisterTokenReq {
  @IsEmail()
  @Transform(({ value }) => value.toString().toLowerCase())
  email: string
}
