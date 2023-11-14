import { AdminPostAuthReq } from '@medusajs/medusa'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString, MaxLength, MinLength } from 'class-validator'
import { NextFunction, Response } from 'express'
import _ from 'lodash'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { User } from '../entity/user.entity'
import CustomerService from '../services/customer.service'
import UserService, { RegisterTokenPayload } from '../services/user.service'

/**
 * @oas [post] /users/register/{token}
 * operationId: "CreateUsersUserRegister"
 * summary: "Register Account"
 * description: "Register for a User with a given register-token."
 * x-authenticated: false
 * parameters:
 *   - (path) token=* {string} The register token of the User.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/UserRegisterReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User
 * responses:
 *   "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *          type: object
 *          required:
 *            - user
 *          properties:
 *            user:
 *              $ref: "#/components/schemas/user"
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
export default async (
  req: MedusaRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    req.body = await handleRegister(req)
    next()
  } catch (error) {
    next(error)
  }
}

async function handleRegister(req: MedusaRequest): Promise<AdminPostAuthReq> {
  const validated = await validator(UserRegisterReq, req.body)
  const { email }: RegisterTokenPayload = req.scope.resolve('registeredUser')

  const userService: UserService = req.scope.resolve('userService')
  const customerService: CustomerService = req.scope.resolve('customerService')
  const data = { ..._.omit(validated, ['password']), email }

  // Should call a email service provider that sends the token to the user
  const manager: EntityManager = req.scope.resolve('manager')
  await manager.transaction(async (transactionManager) => {
    const user = (await userService
      .withTransaction(transactionManager)
      .create(data, validated.password)) as User
    return await customerService
      .withTransaction(transactionManager)
      .createUserCustomer({ ...validated, email: user.email, id: user.id })
  })

  return {
    email,
    password: validated.password,
  }
}

/**
 * @schema UserRegisterReq
 * title: "UserRegisterReq"
 * description: "Register User"
 * x-resourceId: UserRegisterReq
 * type: object
 * required:
 *   - nickname
 *   - password
 * properties:
 *  nickname:
 *    type: string
 *    description: nickname of user
 *    example: 1_user
 *  password:
 *    type: string
 *    description: password of user
 *    example: 12345678
 *    minLength: 8
 *    maxLength: 50
 */
export class UserRegisterReq {
  @IsString()
  nickname: string

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string
}
