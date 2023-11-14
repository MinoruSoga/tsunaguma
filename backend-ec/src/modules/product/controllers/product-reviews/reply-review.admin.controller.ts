import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [post] /review/reply/{id}
 * operationId: "ReplyReview"
 * summary: "Reply a review"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The id of review.
 * description: "Reply a review"
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         required:
 *           - content
 *         properties:
 *           content:
 *             type: string
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Review
 * responses:
 *   "200":
 *     description: OK
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
const updateOrderReview = async (req: MedusaRequest, res: Response) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  const productReviewsService: ProductReviewsService = req.scope.resolve(
    ProductReviewsService.resolutionKey,
  )

  const data = await validator(ReplyReviewReq, req.body)
  await productReviewsService.reply(
    req.params.id,
    loggedInUser.id,
    data.content,
  )

  res.sendStatus(200)
}

export default updateOrderReview

class ReplyReviewReq {
  @IsString()
  content: string
}
