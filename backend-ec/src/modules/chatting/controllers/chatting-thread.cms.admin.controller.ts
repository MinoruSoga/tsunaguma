import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsArray, IsInt, IsNumber, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LOGGED_IN_USER_KEY } from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { isAdmin } from '../../../modules/user/constant'
import { ChattingService } from '../chatting.service'

/**
 * @oas [post] /chatting/threads-cms
 * operationId: "ListChattingThreadsCms"
 * summary: "List chatting threads cms"
 * description: "List chatting threads cms"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/GetThreadCmsBody"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Chatting
 * responses:
 *   "200":
 *      description: OK
 *      content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties:
 *                  count:
 *                    type: integer
 *                  items:
 *                    type: array
 *                    items:
 *                      $ref: "#/components/schemas/chattingThread"
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
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const chattingService: ChattingService = req.scope.resolve('chattingService')
  const validated = await validator(GetListThreadCmsBody, req.body)

  const data = await chattingService.listThreadCms(validated)
  res.json(data)
}

/**
 * @schema GetThreadCmsBody
 * title: "Get Thread list cms body"
 * description: "Get Thread list cms body"
 * x-resourceId: GetThreadCmsBody
 * properties:
 *  display_id:
 *    type: number
 *  store_name:
 *    type: string
 *  store_id:
 *    type: number
 *  sent_date_from:
 *    type: string
 *  sent_date_to:
 *    type: string
 *  sent_time_from:
 *    type: string
 *  sent_time_to:
 *    type: string
 *  customer_id:
 *    type: number
 *  nickname:
 *    type: string
 *  free_word:
 *    type: string
 *  store_email:
 *    type: string
 *  user_email:
 *    type: string
 *  unprocessed_days:
 *    type: string
 *  status:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *  attached:
 *    type: array
 *    items:
 *      anyOf:
 *        - type: string
 *  limit:
 *    type: number
 *  offset:
 *    type: number
 */

export class GetListThreadCmsBody {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  display_id?: number

  @IsString()
  @IsOptional()
  store_name?: string

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  store_id?: string

  @IsString()
  @IsOptional()
  sent_date_from

  @IsString()
  @IsOptional()
  sent_date_to

  @IsString()
  @IsOptional()
  sent_time_from

  @IsString()
  @IsOptional()
  sent_time_to

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  customer_id?: number

  @IsOptional()
  @IsString()
  nickname: string

  @IsString()
  @IsOptional()
  free_word: string

  @IsArray()
  @IsOptional()
  status: string[]

  @IsString()
  @IsOptional()
  unprocessed_days: string

  @IsArray()
  @IsOptional()
  attached: string[]

  @IsString()
  @IsOptional()
  store_email?: string

  @IsString()
  @IsOptional()
  user_email?: string
}
