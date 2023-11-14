import { validator } from '@medusajs/medusa/dist/utils/validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { UploadService } from '../upload.service'
import { UploadFileReq } from './upload-user-avatar.admin.controller'

/**
 * @oas [post] /upload/csv
 * operationId: "GenUploadCsvPresignedUrl"
 * summary: "Generate upload csv presigned url"
 * description: "Generate upload csv presigned url"
 * x-authenticated: true
 * requestBody:
 *   description: Generate upload upload csv presigned url (no need to provide file extension, just file name)
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
export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const uploadService: UploadService = req.scope.resolve(
    UploadService.resolutionKey,
  )
  const validated = await validator(UploadFileReq, req.body)
  const presigned = await uploadService.genUploadCsvLink(validated)
  res.json(presigned)
}
