import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsString, ValidateNested } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { LoggedInUser } from 'src/interfaces/loggedin-user'

import { UploadService } from '../upload.service'

/**
 * @oas [post] /upload/store/image
 * operationId: "GenStoreImagePresignedUrl"
 * summary: "Generate store image presigned url"
 * description: "Generate store image presigned url"
 * x-authenticated: true
 * requestBody:
 *   description: Generate upload store image presigned url
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *            $ref: "#/components/schemas/UploadStoreFileReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Upload
 * responses:
 *   "201":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: array
 *           items:
 *              $ref: "#/components/schemas/GenPresignedStoreImageUrlResponse"
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
const genStoreImageUrlController = async (
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
  const validated = await validator(UploadStoreFileReq, req.body)
  const presigned = await uploadService.genStoreImageUrl(
    loggedInUser.store_id,
    validated.items,
  )

  res.json(presigned)
}

/**
 * @schema UploadStoreFileItemReq
 * title: "UploadStoreFileItemReq"
 * description: "Upload store file Item"
 * x-resourceId: UploadStoreFileItemReq
 * type: object
 * required:
 *   - fileName
 * properties:
 *     fileName:
 *       type: string
 *       description: name of the file
 *       example: test.png
 */
export class UploadStoreFileItemReq {
  @IsString()
  fileName: string
}

/**
 * @schema GenPresignedStoreImageUrlResponse
 * title: "GenPresignedStoreImageUrlResponse"
 * x-resourceId: GenPresignedStoreImageUrlResponse
 * type: object
 * required:
 *   - url
 *   - key
 *   - bucket
 * properties:
 *   url:
 *     type: string
 *     description: The URL to upload file.
 *     format: uri
 *   key:
 *     type: string
 *     description: The key to upload file.
 *   bucket:
 *     type: string
 *     description: The bucker to store file.
 */

/**
 * @schema UploadStoreFileReq
 * title: "UploadStoreFileReq"
 * description: "Upload file request body"
 * x-resourceId: UploadStoreFileReq
 * type: object
 * required:
 *   - items
 * properties:
 *     items:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/UploadStoreFileItemReq"
 */
export class UploadStoreFileReq {
  @ValidateNested({ each: true })
  @Type(() => UploadStoreFileItemReq)
  items: UploadStoreFileItemReq[]
}

export default genStoreImageUrlController
