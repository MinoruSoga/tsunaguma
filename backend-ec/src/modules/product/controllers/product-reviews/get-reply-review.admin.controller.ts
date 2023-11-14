import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../../interfaces/loggedin-user'
import { ProductReviewsService } from '../../services/product-reviews.service'

/**
 * @oas [get] /review/reply/{id}
 * operationId: "GetReviewReply"
 * summary: "Get review reply"
 * x-authenticated: false
 * description: "Get order reviews"
 * parameters:
 *   - (path) id=* {string} The id of review.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Review
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *      application/json:
 *        schema:
 *          required:
 *             - is_replied
 *             - data
 *          properties:
 *             is_replied:
 *                type: boolean
 *             data:
 *                $ref: "#/components/schemas/product_reviews"
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
const getReviewsByOrderAndUser = async (req: MedusaRequest, res: Response) => {
  const productReviewsService: ProductReviewsService = req.scope.resolve(
    ProductReviewsService.resolutionKey,
  )

  const result = await productReviewsService.getReviewReply(req.params.id)

  res.json(result)
}

export default getReviewsByOrderAndUser
