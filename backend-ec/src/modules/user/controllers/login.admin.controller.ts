import { AdminPostAuthReq, AuthService } from '@medusajs/medusa'
import { ConfigModule } from '@medusajs/medusa/dist/types/global'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Response } from 'express'
import jwt from 'jsonwebtoken'
import _ from 'lodash'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { User, UserStatus } from '../entity/user.entity'

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
