import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import UserService from '../services/user.service'

/**
 * @oas [post] /users/forgot-password
 * operationId: "RequestForgotPassword"
 * summary: "Request Forgot Password"
 * description: "Send a token to user's email to reset their password"
 * x-authenticated: false
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/RequestForgotPwReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User
 * responses:
 *  "204":
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
export default async (req: MedusaRequest, res: Response) => {
  /*
      - validate email
      - check email exists or not
      - generate forgot password token
      - and send that token to user through email
  */
  const userService = req.scope.resolve('userService') as UserService
  const entityManager: EntityManager = req.scope.resolve('manager')

  const validated = await validator(RequestForgotPwReq, req.body)

  const { email } = validated

  await entityManager.transaction(async (transactionManager) => {
    return await userService
      .withTransaction(transactionManager)
      .genResetPasswordToken(email)
  })

  res.sendStatus(204)
}

/**
 * @schema RequestForgotPwReq
 * title: "RequestForgotPwReq"
 * description: "Request for Reset Password Token"
 * x-resourceId: RequestForgotPwReq
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
export class RequestForgotPwReq {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @Transform(({ value }) => value.toString().toLowerCase())
  email: string
}
