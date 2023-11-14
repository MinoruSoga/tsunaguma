import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { UploadService } from '../upload.service'

/**
 * @oas [post] /upload/inquiry
 * operationId: "GenInquiryAttachmentPresignedUrl"
 * summary: "Generate inquiry attachment presigned url"
 * description: "Generate inquiry attachment presigned url"
 * x-authenticated: false
 * requestBody:
 *   description: Generate upload inquiry attachment presigned url
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *            $ref: "#/components/schemas/UploadInquiryAttachmentReq"
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
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
const genInquiryAttachmentUrlController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const uploadService: UploadService = req.scope.resolve(
    UploadService.resolutionKey,
  )
  const validated = await validator(UploadFileItemReq, req.body)
  const presigned = await uploadService.genInquiryAttachmentUrl(validated)
  res.json(presigned)
}

export default genInquiryAttachmentUrlController

/**
 * @schema UploadInquiryAttachmentReq
 * title: "UploadInquiryAttachmentReq"
 * description: "Upload inquiry attachment"
 * x-resourceId: UploadInquiryAttachmentReq
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
