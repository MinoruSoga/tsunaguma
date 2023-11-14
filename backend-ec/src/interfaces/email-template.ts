export type AttachmentMail = {
  fileName: string
  s3Key: string
  bucket?: string
}

export type EmailTemplateData = {
  to: string | string[]
  format: string
  data?: object
  bcc?: string | string[]
  attachments?: AttachmentMail[]
  customer_id?: string
}

export interface IEmailTemplateDataService {
  genEmailData(event: string, data: unknown): Promise<EmailTemplateData>
}
