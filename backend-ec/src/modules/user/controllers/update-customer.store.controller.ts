import {
  defaultStoreCustomersFields,
  defaultStoreCustomersRelations,
} from '@medusajs/medusa'
import { validateEmail } from '@medusajs/medusa/dist/utils/is-email'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsOptional, IsString } from 'class-validator'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import CustomerService from '../services/customer.service'
import UserService from '../services/user.service'

/**
 * @oas [post] /customers/me
 * operationId: PostCustomersCustomer
 * summary: Update Customer
 * description: "Updates a Customer's saved details."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - current_password
 *         properties:
 *           password:
 *             description: "The Customer's password."
 *             type: string
 *           email:
 *             description: "The email of the customer."
 *             type: string
 *           current_password:
 *             type: string
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS Client
 *     source: |
 *       import Medusa from "@medusajs/medusa-js"
 *       const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
 *       // must be previously logged
 *       medusa.customers.update({
 *         first_name: 'Laury'
 *       })
 *       .then(({ customer }) => {
 *         console.log(customer.id);
 *       });
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl --location --request POST 'https://medusa-url.com/store/customers/me' \
 *       --header 'Cookie: connect.sid={sid}' \
 *       --header 'Content-Type: application/json' \
 *       --data-raw '{
 *           "first_name": "Laury"
 *       }'
 * security:
 *   - cookie_auth: []
 * tags:
 *   - Customer
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             customer:
 *               $ref: "#/components/schemas/customer"
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
 */
export default async (req: MedusaRequest, res) => {
  const id = req.user.customer_id

  const validated = await validator(UpdateLoginInfoReq, req.body)
  // validate email, and convert it to lowercase format
  if (!!validated.email) {
    validated.email = validateEmail(validated.email)
  }

  const { current_password, email, password } = validated

  const customerService: CustomerService = req.scope.resolve('customerService')
  const userService: UserService = req.scope.resolve('userService')
  const manager: EntityManager = req.scope.resolve('manager')
  await manager.transaction(async (transactionManager) => {
    const customer = await customerService.retrieve(id, {
      select: ['id', 'password_hash', 'email'],
    })

    const isPasswordValid = await customerService.verifyPassword_(
      current_password,
      customer.password_hash,
    )

    if (!isPasswordValid)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'Current password is not valid',
      )

    if (email) {
      const isEmailExist =
        customer.email === email
          ? false
          : await customerService.isEmailExist(email)

      if (isEmailExist) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          'Email has already been taken',
        )
      }
    }

    if (password) {
      const isNewPasswordValid = await customerService.verifyPassword_(
        password,
        customer.password_hash,
      )
      if (isNewPasswordValid)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'New password is not valid',
        )
    }

    // update customer info
    await customerService
      .withTransaction(transactionManager)
      .update(id, validated)

    // update user info
    await userService.withTransaction(transactionManager).updateLoginInfo(id, {
      email: validated.email,
      password: validated.password,
    })
  })

  const customer = await customerService.retrieve(id, {
    relations: defaultStoreCustomersRelations,
    select: defaultStoreCustomersFields,
  })

  res.status(200).json({ customer })
}

export class UpdateLoginInfoReq {
  @IsString()
  current_password: string

  @IsString()
  @IsOptional()
  email?: string

  @IsString()
  @IsOptional()
  password?: string
}
