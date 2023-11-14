import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsObject, IsOptional, IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { UserCouponService } from '../../services/user-coupon.service'

/**
 * @oas [post] /user-coupon
 * operationId: "PostUserCoupon"
 * summary: "Creates a User coupon"
 * x-authenticated: true
 * description: "Creates a User coupon."
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - discount_id
 *         properties:
 *           discount_id:
 *             type: string
 *             description: coupon id
 *           metadata:
 *             type: object
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - User-coupon
 * responses:
 *   201:
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/user_coupon"
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

export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const loggedInUser = req.scope.resolve('loggedInUser') as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login!')
  }

  const validated = await validator(AdminCreateUserCoupon, req.body)

  const ucService = req.scope.resolve('userCouponService') as UserCouponService

  const result = await ucService.create({
    ...validated,
    user_id: loggedInUser?.id,
  })

  res.status(201).json(result)
}

export class AdminCreateUserCoupon {
  @IsString()
  discount_id: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}
