import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { PointService } from '../services/point.service'

/**
 * @oas [get] /point/history/{id}/cms
 * operationId: "UserPointHistoryCms"
 * summary: "User Point History Admin Cms"
 * description: "get point history for admin cms"
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the customer
 *   - in: query
 *     name: take
 *     schema:
 *       type: integer
 *     description: The numbers of items to return
 *   - in: query
 *     name: page
 *     schema:
 *       type: integer
 *     description: current page
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Point
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *       application/json:
 *         schema:
 *            type: object
 *            properties:
 *                items:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/userPointHistory'
 *                count:
 *                  type: integer
 *                  description: count result
 *  "400":
 *     $ref: "#/components/responses/400_error"
 *  "404":
 *     $ref: "#/components/responses/not_found_error"
 *  "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *  "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *  "500":
 *     $ref: "#/components/responses/500_error"
 */
export default async (req: MedusaAuthenticatedRequest, res: Response) => {
  const pointService = req.scope.resolve('pointService') as PointService
  const { id } = req.params
  const histories = await pointService.listUser(id, req)

  res.send(histories)
}
