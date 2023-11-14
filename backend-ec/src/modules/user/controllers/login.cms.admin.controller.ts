import { AdminPostAuthReq, AuthService } from '@medusajs/medusa'
import { ConfigModule } from '@medusajs/medusa/dist/types/global'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Response } from 'express'
import jwt from 'jsonwebtoken'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { User, UserStatus, UserType } from './../entity/user.entity'

const adminTypes = [UserType.ADMIN_ADMIN, UserType.ADMIN_STAFF]

/**
 * @oas [post] /auth/cms
 * operationId: "PostAuthCMS"
 * summary: "Amin Login CMS"
 * x-authenticated: false
 * description: "Logs a Admin in and authorizes them to manage Store settings."
 * parameters:
 *   - (body) email=* {string} The User's email.
 *   - (body) password=* {string} The User's password.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - email
 *           - password
 *         properties:
 *           email:
 *             type: string
 *             description: The User's email.
 *             format: email
 *           password:
 *             type: string
 *             description: The User's password.
 *             format: password
 * tags:
 *   - Auth
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *          properties:
 *            user:
 *              $ref: "#/components/schemas/user"
 *  "400":
 *    $ref: "#/components/responses/400_error"
 *  "401":
 *    $ref: "#/components/responses/incorrect_credentials"
 *  "404":
 *    $ref: "#/components/responses/not_found_error"
 *  "409":
 *    $ref: "#/components/responses/invalid_state_error"
 *  "422":
 *    $ref: "#/components/responses/invalid_request_error"
 *  "500":
 *    $ref: "#/components/responses/500_error"
 */

export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const {
    projectConfig: { jwt_secret },
  } = req.scope.resolve('configModule') as ConfigModule
  if (!jwt_secret) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Please configure jwt_secret in your environment',
    )
  }
  const validated = await validator(AdminPostAuthReq, req.body)

  const authService: AuthService = req.scope.resolve('authService')
  const manager: EntityManager = req.scope.resolve('manager')
  const result = await manager.transaction(async (transactionManager) => {
    return await authService
      .withTransaction(transactionManager)
      .authenticate(validated.email, validated.password)
  })

  if (
    !result.success ||
    !result.user ||
    !adminTypes.includes((result.user as User).type) ||
    (result.user as User).status !== UserStatus.ACTIVE
  ) {
    res.sendStatus(401)
    return
  }
  // Add JWT to cookie
  const userId = result.user.id
  const jwtToken = jwt.sign(
    { id: userId, userId: result.user.id, customer_id: userId },
    jwt_secret,
    {
      expiresIn: '30d',
    },
  )
  // req.session.jwt = jwtToken

  const cleanRes = _.omit(result.user, ['password_hash'])

  res.json({ user: { ...cleanRes, jwt: jwtToken } })
}
