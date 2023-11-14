import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { UploadService } from '../upload.service'

/**
 * @oas [post] /upload/store/avatar
 * operationId: "GenStoreAvatarPresignedUrl"
 * summary: "Generate store avatar presigned url"
 * description: "Generate store avatar presigned url"
 * x-authenticated: true
 * requestBody:
 *   description: Generate upload store avatar presigned url
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *            $ref: "#/components/schemas/UploadStoreAvatarReq"
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
const genStoreAvatarUrlController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const uploadService: UploadService = req.scope.resolve(
    UploadService.resolutionKey,
  )
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  if (!loggedInUser?.store_id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'not a store')
  }
  const validated = await validator(UploadFileItemReq, req.body)
  const presigned = await uploadService.genStoreAvatarUrl(
    loggedInUser.store_id,
    validated,
  )
  res.json(presigned)
}

export default genStoreAvatarUrlController

/**
 * @schema UploadStoreAvatarReq
 * title: "UploadStoreAvatarReq"
 * description: "Upload store avatar"
 * x-resourceId: UploadStoreAvatarReq
 * type: object
 * required:
 *   - fileName
 * properties:
 *     fileName:
 *       type: string
 *       description: name of the file
 *       example: test.png
 */
export class UploadFileItemReq {
  @IsString()
  fileName: string
}
