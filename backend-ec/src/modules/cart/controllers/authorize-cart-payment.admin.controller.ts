import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { GmoMember } from '../../user/entity/gmo-member.entity'
import { GmoService } from '../../user/services/gmo.service'
import { CartService } from '../services/cart.service'

export enum GmoCardAuthenType {
  TOKEN = 'token',
  MEMBER = 'member',
}

/**
 * @oas [post] /carts/{id}/authorize
 * operationId: "AuthorizeGmoCardPayment"
 * description: "Authorized GMO card payment"
 * summary: "Authorized GMO card payment"
 * parameters:
 *   - (path) id=* {string} The cart ID.
 * requestBody:
 *   description: Token to authorize GMO card
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *            - type
 *         properties:
 *            token:
 *              type: string
 *            cardSeq:
 *              type: string
 *            type:
 *              type: string
 *              enum: [token, member]
 * tags:
 *   - Cart
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *          properties:
 *            cart:
 *              $ref: "#/components/schemas/cart"
 *  "400":
 *    $ref: "#/components/responses/400_error"
 *  "404":
 *    $ref: "#/components/responses/not_found_error"
 *  "409":
 *    $ref: "#/components/responses/invalid_state_error"
 *  "422":
 *    $ref: "#/components/responses/invalid_request_error"
 *  "500":
 *    $ref: "#/components/responses/500_error"
 */
export default async (req: MedusaRequest, res: Response) => {
  const { id } = req.params
  const cartService = req.scope.resolve('cartService') as CartService
  const loggedInUser = req.scope.resolve('loggedInUser') as LoggedInUser
  const gmoMemberService = req.scope.resolve(
    GmoService.resolutionKey,
  ) as GmoService

  const validated = await validator(AuthorizeCartPaymentReq, req.body)
  const { type, cardSeq, token } = validated

  let gmoMem: GmoMember
  if (type === GmoCardAuthenType.MEMBER) {
    if (!cardSeq) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Card sequence is required!',
      )
    }

    gmoMem = await gmoMemberService.retrieveMember(loggedInUser.id)
  }

  if (type === GmoCardAuthenType.TOKEN && !token)
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Token is required!')

  const cart = await cartService.authorizeGmoCardPayment(id, {
    ...validated,
    memberId: gmoMem?.member_id,
  })

  res.json({ cart })
}

export class AuthorizeCartPaymentReq {
  @IsOptional()
  @IsString()
  token?: string

  @IsEnum(GmoCardAuthenType, {
    always: true,
    message: `Invalid value (authen type must be one of following values: ${Object.values(
      GmoCardAuthenType,
    ).join(', ')})`,
  })
  type: GmoCardAuthenType

  @IsString()
  @IsOptional()
  cardSeq: string
}
