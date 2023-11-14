import EventBusService from '@medusajs/medusa/dist/services/event-bus'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString, MaxLength, MinLength } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import loadConfig from '../../../helpers/config'
import CustomerService from '../services/customer.service'
import UserService from '../services/user.service'

/**
 * @oas [put] /users/forgot-password/{token}
 * operationId: "ResetUserPassword"
 * summary: "Reset User Password"
 * description: "Reset user password when user forgot their password"
 * parameters:
 *   - (path) token=* {string} The reset password token of the User.
 * x-authenticated: false
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/ResetPasswordReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User
 * responses:
 *   "200":
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
const resetUserPasswordController = async (
  req: MedusaRequest,
  res: Response,
) => {
  const manager: EntityManager = req.scope.resolve('manager')

  // use a middleware to validate the reset password token
  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService
  const validated = await validator(ResetPasswordReq, req.body)
  const { email, password } = validated

  // check if email decoded from token match with email param
  const { email: decodedEmail }: ResetPasswordPayload =
    req.scope.resolve('resetPasswordUser')

  if (email !== decodedEmail)
    throw new MedusaError(MedusaError.Types.CONFLICT, 'Email is not valid')

  const userService: UserService = req.scope.resolve('userService')
  const customerService: CustomerService = req.scope.resolve('customerService')

  // retrieve user from the email
  const user = await userService.retrieveByEmail(email, { select: ['id'] })

  if (!user)
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'User does not exist')

  await manager.transaction(async (tx) => {
    await userService.withTransaction(tx).setPassword_(user.id, password)
    await userService.withTransaction(tx).setResetPasswordToken(user.id, null)
    await customerService.withTransaction(tx).setPassword_(user.id, password)
    await eventBusService
      .withTransaction(tx)
      .emit(UserService.Events.PASSWORD_RESET_COMPLETE, {
        id: email,
        email,
        format: 'reset-password-complete',
        customer_id: user.id,
        data: {
          contactLink: loadConfig().frontendUrl.contact,
        },
      })
    await eventBusService.withTransaction(tx).emit(UserService.Events.UPDATED, {
      id: user.id,
      metadata: { description: 'Update user: forgot password' },
    })
  })

  res.sendStatus(200)
}

/**
 * @schema ResetPasswordReq
 * title: "ResetPasswordReq"
 * description: "Reset User Password"
 * x-resourceId: ResetPasswordReq
 * type: object
 * required:
 *   - email
 *   - token
 *   - password
 * properties:
 *  email:
 *    type: string
 *    format: email
 *    description: email of user
 *    example: 1_user
 *  password:
 *    type: string
 *    description: password of user
 *    example: 12345678
 *    minLength: 8
 *    maxLength: 50
 */
export class ResetPasswordReq {
  @IsString()
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string
}

export type ResetPasswordPayload = {
  email: string
  exp: number
}

export default resetUserPasswordController
