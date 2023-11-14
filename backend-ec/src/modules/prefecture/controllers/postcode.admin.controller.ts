import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'

import { PostcodeService } from '../services/postcode.service'

/**
 * @oas [get] /postcode/{id}
 * operationId: "GetPostcodeDetail"
 * summary: "Get post code information"
 * description: "Retrieve post code information"
 * x-authenticated: false
 * parameters:
 *   - (path) id=* {string} The post-code.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Prefecture
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/Postcode"
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
const getPostcodeByIdController = async (req: MedusaRequest, res: Response) => {
  const { id } = req.params

  const postcodeService = req.scope.resolve(
    PostcodeService.resolutionKey,
  ) as PostcodeService

  const data = await postcodeService.retrieve(id)
  res.send(data)
}

export default getPostcodeByIdController
