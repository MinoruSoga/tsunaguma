/* eslint-disable @typescript-eslint/ban-ts-comment */
import { User } from '@medusajs/medusa'
import { AuthService as MedusaAuthService } from '@medusajs/medusa/dist/services'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import CustomerService from './customer.service'
import UserService from './user.service'

type ConstructorParams = {
  manager: EntityManager
  userService: UserService
  customerService: CustomerService
}

@Service({ override: MedusaAuthService })
export default class AuthService extends MedusaAuthService {
  protected readonly userService: UserService

  constructor(private readonly container: ConstructorParams) {
    // @ts-ignore
    super(container)
    this.userService = container.userService
  }

  /**
   * Authenticates a given user with an API token
   * @param {string} token - the api_token of the user to authenticate
   * @return {AuthenticateResult}
   *    success: whether authentication succeeded
   *    user: the user document if authentication succeded
   *    error: a string with the error message
   */
  async authenticateAPIToken(token: string): Promise<any> {
    return await this.atomicPhase_(async (transactionManager) => {
      if (process.env.NODE_ENV?.startsWith('dev')) {
        try {
          const user: User = await this.userService_
            .withTransaction(transactionManager)
            .retrieve(token)
          return {
            success: true,
            user,
          }
        } catch (error) {
          // ignore
          return {
            success: false,
            error: {
              message: 'Invalid API Token',
              type: MedusaError.Types.NOT_ALLOWED,
            },
          }
        }
      }

      try {
        const user: User = await this.userService
          .withTransaction(transactionManager)
          .retrieveByApiToken(token)

        return {
          success: true,
          user,
        }
      } catch (error) {
        return {
          success: false,
          error: {
            message: 'Invalid API Token',
            type: MedusaError.Types.NOT_ALLOWED,
          },
        }
      }
    })
  }
}
