import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { UploadService } from '../upload.service'

/**
 * @oas [post] /upload/avatar
 * operationId: "GenAvatarPresignedUrl"
 * summary: "Generate user avatar presigned url"
 * description: "Generate user avatar presigned url"
 * x-authenticated: true
 * requestBody:
 *   description: Generate upload user avatar presigned url
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *            $ref: "#/components/schemas/UploadFileItemReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Upload
 * responses:
 *   201:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
             $ref: "#/components/schemas/GenPresignedUrlResponse"
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
const genAvatarUrlController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  const uploadService: UploadService = req.scope.resolve(
    UploadService.resolutionKey,
  )
  const validated = await validator(UploadFileReq, req.body)
  const presigned = await uploadService.genAvatarUrl(loggedInUser.id, validated)
  res.json(presigned)
}

export class UploadFileReq {
  @IsString()
  fileName: string
}

export default genAvatarUrlController
