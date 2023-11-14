import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'
import { Response } from 'express'
import { MedusaRequest } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { Attachment } from '../attachment/entity/attachment.entity'
import { InquiryService } from './inquiry.service'

/**
 * @oas [post] /contact/inquiry
 * operationId: "CreateInquiryForm"
 * summary: "Create contact form"
 * description: "Create contact form to system."
 * x-authenticated: false
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/InquiryReq"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Inquiry
 * responses:
 *   "204":
 *     description: OK
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
export default async (req: MedusaRequest, res: Response) => {
  const validated = await validator(InquiryReq, req.body)
  const inquiryService: InquiryService = req.scope.resolve('inquiryService')

  const manager: EntityManager = req.scope.resolve('manager')

  await manager.transaction(async (transactionManager) => {
    return inquiryService.withTransaction(transactionManager).create(validated)
  })

  res.sendStatus(204)
}
/**
 * @schema InquiryReq
 * title: "InquiryReq"
 * description: "Request for Register Token"
 * x-resourceId: InquiryReq
 * type: object
 * required:
 *   - first_name
 *   - last_name
 *   - first_name_kana
 *   - last_name_kana
 *   - email
 *   - phone
 *   - type
 * properties:
 *  first_name:
 *    type: string
 *    description: "First name"
 *    example: some name
 *  last_name:
 *    type: string
 *    description: "Last name"
 *    example: family name
 *  first_name_kana:
 *    type: string
 *    description: "First name kana"
 *    example: name kana
 *  last_name_kana:
 *    type: string
 *    description: "Last name kana"
 *    example: Last name kana
 *  email:
 *    type: string
 *    format: email
 *    description: email for user
 *    example: 1@user.com
 *  phone:
 *    type: string
 *    description: "Phone number"
 *    example: phone
 *  type:
 *    type: number
 *    description: type of inquiry contact to system
 *    example: contact
 *  content:
 *    type: string
 *    description: content send to admin
 *    example: i have a question..
 *  attachments:
 *    type: array
 *    items:
 *      $ref: "#/components/schemas/attachment"
 *    description: "Array of Attachment"
 *    example: []
 */
export class InquiryReq {
  @IsString()
  first_name: string
  @IsString()
  last_name: string
  @IsString()
  first_name_kana: string
  @IsString()
  last_name_kana: string
  @IsEmail()
  email: string
  @IsString()
  phone: string

  @IsNumber()
  @Min(1)
  @Max(12)
  type: number

  @IsString()
  content: string

  @IsArray()
  @IsOptional()
  attachments: Attachment[]
}
