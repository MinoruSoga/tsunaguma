import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { TransactionBaseService } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { generateEntityId } from '@medusajs/medusa/dist/utils'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import path from 'path'
import { EntityManager } from 'typeorm'
import { v4 as uuid } from 'uuid'

import loadConfig from '../../helpers/config'
import {
  generateExportCsvKey,
  generateImportCsvKey,
} from '../../helpers/upload'
import StoreService from '../store/services/store.service'
import UserService from '../user/services/user.service'
import { UploadFileItemReq } from './controllers/upload-product-image-url.admin.controller'
import { UploadStoreFileItemReq } from './controllers/upload-store-image.admin.controller'

type InjectedDependencies = {
  manager: EntityManager
  logger: Logger
  userService: UserService
  storeService: StoreService
}

@Service()
export class UploadService extends TransactionBaseService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'uploadService'
  protected container_: InjectedDependencies
  protected userService: UserService
  protected storeService: StoreService

  private privateBucket: string
  private publicBucket: string
  private s3Client: S3Client
  private logger_: Logger

  private readonly manager: EntityManager

  constructor(container: InjectedDependencies) {
    super(container)
    const config = loadConfig()

    this.container_ = container
    this.userService = container.userService
    this.storeService = container.storeService
    this.manager = container.manager
    this.logger_ = container.logger
    this.privateBucket = config.awsS3.privateBucket
    this.publicBucket = config.awsS3.publicBucket

    this.s3Client = new S3Client({
      endpoint: config.awsS3.endpoint,
      region: config.awsS3.region,
      forcePathStyle: true,
    })
  }

  getReadSignedUrl(bucket: string, key: string, expiresIn = 600) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    return getSignedUrl(this.s3Client, command, { expiresIn })
  }

  genUploadPresignedUrl(bucket: string, key: string, expiresIn = 600) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    })
    return getSignedUrl(this.s3Client, command, { expiresIn })
  }

  async genProductImagesUrl(
    storeId: string,
    items: UploadFileItemReq[],
  ): Promise<GenPresignedUrlResponse[]> {
    return await Promise.all(
      items.map(async (item) => {
        this.logger_.debug(`genProductImageUrl: ${item.fileName}`)

        // generate new key for product image
        const key = `product/${storeId}_${item.uploadId}${path.extname(
          item.fileName,
        )}`
        const url = await this.genUploadPresignedUrl(this.publicBucket, key)
        return {
          url,
          key,
          bucket: this.publicBucket,
        }
      }),
    )
  }

  async genAvatarUrl(
    userId: string,
    opts: { fileName: string },
  ): Promise<GenPresignedUrlResponse> {
    this.logger_.debug(`genAvatarUrl: ${userId} ${opts.fileName}`)
    const user = await this.userService.retrieve(userId, {
      select: ['avatar', 'id'],
    })
    if (!user) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'User not found')
    }
    let idx = 0

    if (user.avatar) {
      idx =
        1 +
        parseInt(
          path.basename(user.avatar, path.extname(user.avatar)).split('_')[1],
        )

      if (isNaN(idx)) {
        idx = 1
      }
    }

    // const key = `avatars/${userId.replace('usr_', '')}_${idx}${path.extname(
    //   opts.fileName,
    // )}
    // `
    const key = `avatars/user/${uuid()}${path.extname(opts.fileName)}`
    const url = await this.genUploadPresignedUrl(this.publicBucket, key)
    return {
      url,
      key,
      bucket: this.publicBucket,
    }
  }

  async genStoreAvatarUrl(
    storeId: string,
    opts: { fileName: string },
  ): Promise<GenPresignedUrlResponse> {
    this.logger_.debug(`genStoreAvatarUrl: ${opts.fileName}`)
    const store = await this.storeService.retrieve_(storeId)
    let idx = 0
    if (store.avatar) {
      idx =
        1 +
        parseInt(
          path.basename(store.avatar, path.extname(store.avatar)).split('_')[1],
        )
      if (isNaN(idx)) {
        idx = 1
      }
    }
    // const key = `avatars/${store.id.replace('store_', '')}_${idx}${path.extname(
    //   opts.fileName,
    // )}`
    const key = `avatars/store/${uuid()}${path.extname(opts.fileName)}`
    const url = await this.genUploadPresignedUrl(this.publicBucket, key)
    return {
      url,
      key,
      bucket: this.publicBucket,
    }
  }

  async genStoreImageUrl(
    storeId: string,
    items: UploadStoreFileItemReq[],
  ): Promise<GenPresignedUrlResponse[]> {
    return await Promise.all(
      items.map(async (item) => {
        this.logger_.debug(`genStoreImageUrl: ${item.fileName}`)

        const key = `store/${storeId}_${generateEntityId('')}${path.extname(
          item.fileName,
        )}`

        const url = await this.genUploadPresignedUrl(this.publicBucket, key)
        return {
          url,
          key,
          bucket: this.publicBucket,
        }
      }),
    )
  }

  async genInquiryAttachmentUrl(
    attachment: UploadFileItemReq,
  ): Promise<GenPresignedUrlResponse> {
    this.logger_.debug(`genInquiryAttachmentUrl: ${attachment.fileName}`)
    const key = `inquiry/${generateEntityId('')}${path.extname(
      attachment.fileName,
    )}`
    const url = await this.genUploadPresignedUrl(this.privateBucket, key)
    return {
      url,
      key,
      bucket: this.privateBucket,
    }
  }

  public async genChattingFileUrl(
    userId: string,
    opts: { fileName: string },
  ): Promise<GenPresignedUrlResponse> {
    this.logger_.debug(`genChattingFileUrl: ${opts.fileName}`)
    const user = await this.userService.retrieve(userId, {
      select: ['avatar', 'id'],
    })
    if (!user) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'User not found')
    }

    const key = `chatting/${user.id}/${generateEntityId('')}${path.extname(
      opts.fileName,
    )}`

    const url = await this.genUploadPresignedUrl(this.publicBucket, key)

    return {
      url,
      key,
      bucket: this.publicBucket,
    }
  }

  public async genUploadCsvLink({
    fileName,
  }: {
    fileName: string
  }): Promise<GenPresignedUrlResponse> {
    const key = generateImportCsvKey(fileName)
    const url = await this.genUploadPresignedUrl(this.privateBucket, key)

    return {
      bucket: this.privateBucket,
      key,
      url,
    }
  }

  async uploadCsv(file: Buffer | string, fileName = `${Date.now()}`) {
    const key = generateExportCsvKey(fileName)
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.privateBucket,
        Key: key,
        Body: file,
      }),
    )

    return key
  }

  getCsvLink(key: string, expiresIn?: number) {
    return this.getReadSignedUrl(this.privateBucket, key, expiresIn)
  }

  async getS3Stream(key: string, bucket = this.privateBucket) {
    const res = await this.s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    )

    return res.Body
  }
}

type GenPresignedUrlResponse = {
  url: string
  key: string
  bucket: string
}
