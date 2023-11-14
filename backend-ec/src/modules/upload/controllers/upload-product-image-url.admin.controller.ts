import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Type } from 'class-transformer'
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { UploadService } from '../upload.service'

/**
 * @oas [post] /upload/product-image
 * operationId: "GenProductImagesPresignedUrl"
 * summary: "Generate product images presigned url"
 * description: "Generate product images presigned url"
 * x-authenticated: true
 * requestBody:
 *   description: Params to create a product addon
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *            $ref: "#/components/schemas/UploadFileReq"
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
 *           type: array
 *           items:
 *              $ref: "#/components/schemas/GenPresignedUrlResponse"
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
const genProductImageUrlController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')
  const uploadService: UploadService = req.scope.resolve(
    UploadService.resolutionKey,
  )
  const validated = await validator(UploadFileReq, req.body)
  const presigned = await uploadService.genProductImagesUrl(
    loggedInUser.store_id,
    validated.items,
  )
  res.json(presigned)
}

/**
 * @schema UploadFileItemReq
 * title: "UploadFileItemReq"
 * description: "Upload file Item"
 * x-resourceId: UploadFileItemReq
 * type: object
 * required:
 *   - fileName
 * properties:
 *     fileName:
 *       type: string
 *       description: name of the file
 *       example: test.png
 *     uploadId:
 *       type: string
 *       description: the upload id
 *       example: Asosoxlsmefnrvns
 */
export class UploadFileItemReq {
  @IsString()
  fileName: string

  @IsString()
  @IsOptional()
  uploadId?: string
}

/**
 * @schema GenPresignedUrlResponse
 * title: "GenPresignedUrlResponse"
 * x-resourceId: GenPresignedUrlResponse
 * type: object
 * required:
 *   - url
 *   - key
 *   - bucket
 * properties:
 *            url:
 *             type: string
 *             description: The URL to upload file.
 *             format: uri
 *            key:
 *             type: string
 *             description: The key to upload file.
 *            bucket:
 *             type: string
 *             description: The bucker to store file.
 */

/**
 * @schema UploadFileReq
 * title: "UploadFileReq"
 * description: "Upload file request body"
 * x-resourceId: UploadFileReq
 * type: object
 * required:
 *   - items
 * properties:
 *     items:
 *       type: array
 *       items:
 *         $ref: "#/components/schemas/UploadFileItemReq"
 */
export class UploadFileReq {
  @ValidateNested({ each: true })
  @Type(() => UploadFileItemReq)
  items: UploadFileItemReq[]
}

export default genProductImageUrlController
