import { Module } from 'medusa-extender'

import { UploadRouter } from './upload.router'
import { UploadService } from './upload.service'

@Module({
  imports: [UploadRouter, UploadService],
})
export class UploadModule {}
