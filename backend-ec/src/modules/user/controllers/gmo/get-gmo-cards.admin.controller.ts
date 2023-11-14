import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { GmoService } from '../../services/gmo.service'
import { LOGGED_IN_USER_KEY } from './../../../../helpers/constant'
import { LoggedInUser } from './../../../../interfaces/loggedin-user'

/**
 * @oas [get] /users/gmo-cards
 * operationId: "GetGmoUserCards"
 * summary: "Get cards by user"
 * description: "Get cards by user"
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *               type: array
 *               items:
 *                  $ref: "#/components/schemas/credit_cards"
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
  const gmoService: GmoService = req.scope.resolve(GmoService.resolutionKey)
  const user = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  const data = await gmoService.showCard(user.id)

  res.status(200).json(data || [])
}

/**
 * @schema credit_cards
 * title: "Get credit card"
 * x-resourceId: get_credit_card
 * properties:
 *  CardSeq:
 *    type: string
 *    default: "0"
 *  DefaultFlag:
 *    type: string
 *    default: "0"
 *  CardName:
 *    type: string
 *    default: "test"
 *  CardNo:
 *    type: string
 *    default: "*************111"
 *  Expire:
 *    type: string
 *    default: "2512"
 *  HolderName:
 *    type: string
 *    default: "test"
 *  DeleteFlag:
 *    type: string
 *    default: "0"
 */
