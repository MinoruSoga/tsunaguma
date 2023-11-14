import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { UploadService } from '../upload.service'

/**
 * @oas [post] /upload/chatting
 * operationId: "GenChattingFilePresignedUrl"
 * summary: "Generate chatting file presigned url"
 * description: "Generate chatting file presigned url"
 * x-authenticated: true
 * requestBody:
 *   description: Generate upload chatting file presigned url
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *            $ref: "#/components/schemas/UploadChattingFileReq"
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
const genChattingFileUrlController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser: LoggedInUser = req.scope.resolve('loggedInUser')

  const uploadService: UploadService = req.scope.resolve(
    UploadService.resolutionKey,
  )
  const validated = await validator(UploadChattingFileReq, req.body)
  const presigned = await uploadService.genChattingFileUrl(
    loggedInUser.id,
    validated,
  )
  res.json(presigned)
}

export default genChattingFileUrlController

/**
 * @schema UploadChattingFileReq
 * title: "UploadChattingFileReq"
 * description: "Upload chatting file request"
 * x-resourceId: UploadChattingFileReq
 * type: object
 * required:
 *   - fileName
 * properties:
 *     fileName:
 *       type: string
 *       description: name of the file
 *       example: test.png
 */
export class UploadChattingFileReq {
  @IsString()
  fileName: string
}
