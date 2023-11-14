import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import { generateExportCsvKey } from '../../../helpers/upload'
import { UploadService } from '../upload.service'

/**
 * @oas [get] /upload/export/csv
 * operationId: "GetCsvUploadLink"
 * summary: "Get csv presigned link"
 * description: "Get csv presigned link"
 * x-authenticated: true
 * parameters:
 *   - (query) fileName* {string} Name of the file
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
 *            type: object
 *            required:
 *              - link
 *            properties:
 *               link:
 *                type: string
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
  const validated = await validator(GetCsvLinkParams, req.query)

  const result = await uploadService.getCsvLink(
    generateExportCsvKey(validated.fileName),
  )

  res.json({ link: result })
}

export class GetCsvLinkParams {
  @IsString()
  fileName: string
}
