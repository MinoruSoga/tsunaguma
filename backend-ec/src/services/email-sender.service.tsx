/* eslint-disable @typescript-eslint/no-unused-vars */
import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { AbstractNotificationService } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { render } from '@react-email/render'
import sgMail from '@sendgrid/mail'
import { marked } from 'marked'
import { createTransport, Transporter } from 'nodemailer'
import SESTransport from 'nodemailer/lib/ses-transport'
import path from 'path'
import { EntityManager } from 'typeorm'

import BuyerMessageReception from '../emails/buyer-message-reception'
import { CampaignRequestShop } from '../emails/campaign-request-shop'
import CancelOrderCompleteShop from '../emails/cancel-order-complete-shop'
import { DeliveryRequestArrived } from '../emails/delivery-request-arrived'
import { DeliveryRequestConfirmQuantity } from '../emails/delivery-request-confirm-quantity'
import { DeliveryRequestPublished } from '../emails/delivery-request-published'
import DeliveryRequestShop from '../emails/delivery-request-shop'
import FavoriteProductOnSale from '../emails/favorite-product-on-sale'
import InquiryContact from '../emails/inquiry-contact'
import MembershipRegister from '../emails/membership-register'
import OrderCancelComplete from '../emails/order-cancel-complete'
import OrderCompletion from '../emails/order-completion'
import OrderCompletionPrime from '../emails/order-completion-prime'
import OrderCompletionShop from '../emails/order-completion-shop'
import OrderRequestCancel from '../emails/order-request-cancel'
import OrderShipmentComplete from '../emails/order-shipment-complete'
import PhotoServiceComplete from '../emails/photo-service-complete'
import PointExpireCustomer from '../emails/point-expire-customer'
import RegisterStorePremiumComplete from '../emails/register-store-premium-complete'
import RegisterStoreStandardComplete from '../emails/register-store-standard-complete'
import ResetPasswordComplete from '../emails/reset-password-complete'
import RestockRequestShop from '../emails/restock-request-shop'
import RestockRequestUser from '../emails/restock-request-user'
import RestockVariantAnnouce from '../emails/restock-variant-announce'
import ReturnDeliveryRequested from '../emails/return-delivery-requested.shop'
import ReturnDeliveryShipped from '../emails/return-delivery-shipped-shop'
import ReturnGuaranteeComplete from '../emails/return-guarantee-complete'
import ReturnPurchaseRequest from '../emails/return-purchase-request'
import ReturnReceive from '../emails/return-receive-shop'
import ReviewCompleteShop from '../emails/review-complete-shop'
import ShopMessageReception from '../emails/shop-message-reception'
import UserRegister from '../emails/user-register'
import UserResetPassword from '../emails/user-reset-password'
import UserUpdatedLoginInfo from '../emails/user-updated-login-info'
import UserUpdatedLoginInfoPassword from '../emails/user-updated-login-info-password'
import WithdrawalCustomerComplete from '../emails/withdrawal-customer-complete'
import WithdrawalPremiumComplete from '../emails/withdrawal-premium-complete'
import loadConfig from '../helpers/config'
import { memoizedReadfile } from '../helpers/memoize'
import { streamToBase64, streamToBuffer } from '../helpers/stream'
import {
  EmailTemplateData,
  IEmailTemplateDataService,
} from '../interfaces/email-template'
import { CampaignRequestService } from '../modules/campaign-request/service/campaign-request.service'
import { ChattingService } from '../modules/chatting/chatting.service'
import DeliveryRequestService from '../modules/delivery-request/services/delivery-request.service'
import { InquiryService } from '../modules/inquiries-contact/inquiry.service'
import { OrderService } from '../modules/order/services/order.service'
import { PointService } from '../modules/point/services/point.service'
import { ProductReviewsService } from '../modules/product/services/product-reviews.service'
import { ProductSaleService } from '../modules/product/services/product-sale.service'
import { RestockRequestService } from '../modules/product/services/restock-request.service'
import { ReturnService } from '../modules/return/service/return.service'
import { ReturnDeliveryService } from '../modules/return-delivery/service/return-delivery.service'
import StoreService from '../modules/store/services/store.service'
import { UploadService } from '../modules/upload/upload.service'
import CustomerService from '../modules/user/services/customer.service'
import UserService from '../modules/user/services/user.service'
import WithdrawalService from '../modules/user/services/withdrawal.service'

type InjectedDependencies = {
  userService: UserService
  manager: EntityManager
  logger: Logger
  inquiryService: InquiryService
  customerService: CustomerService
  storeService: StoreService
  orderService: OrderService
  restockRequestService: RestockRequestService
  productSaleService: ProductSaleService
  chattingService: ChattingService
  uploadService: UploadService
  withdrawalService: WithdrawalService
  deliveryRequestService: DeliveryRequestService
  productReviewsService: ProductReviewsService
  returnService: ReturnService
  returnDeliveryService: ReturnDeliveryService
  pointService: PointService
  campaignRequestService: CampaignRequestService
}

export default class EmailSenderService extends AbstractNotificationService {
  static identifier = 'email-sender'

  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  private container: InjectedDependencies
  private uploadService_: UploadService

  private logger: Logger
  private from: { name?: string; email: string }
  private transporter: Transporter<SESTransport.SentMessageInfo>

  constructor(container: InjectedDependencies) {
    super(container)

    this.container = container
    this.manager_ = container.manager
    this.logger = container.logger
    this.uploadService_ = container.uploadService

    const config = loadConfig()

    if (config.email.sendgrid_api_key) {
      sgMail.setApiKey(config.email.sendgrid_api_key)
    } else {
      this.transporter = createTransport({
        SES: {
          ses: new SESClient({ region: 'ap-northeast-1' }),
          aws: { SendRawEmailCommand },
        },
      })
    }

    this.from = {
      email: config.email.email_from,
      name: config.email.email_from_name,
    }
  }

  async sendNotification(
    event: string,
    data: any,
    attachmentGenerator: unknown,
  ): Promise<{ to: string; status: string; data: Record<string, unknown> }> {
    this.logger.debug(
      '[MailService] sendNotification:: ' +
        event +
        ' ==> ' +
        JSON.stringify(data),
    )

    const emailData = await this.findService(event)?.genEmailData?.(event, data)
    if (!emailData) {
      return {
        to: event,
        status: 'failed',
        data,
      }
    }
    let status = 'done'
    try {
      // validate if user is not active
      if (Boolean(emailData.customer_id)) {
        const isValid = await this.checkUserActive(emailData.customer_id)
        if (!isValid) return null
      }

      await this.send(emailData)
    } catch (error) {
      this.logger.error(error)

      status = 'failed'
    }

    return {
      to: Array.isArray(emailData.to) ? emailData.to.join(',') : emailData.to,
      status,
      data,
    }
  }

  private async checkUserActive(userId: string): Promise<boolean> {
    return await this.container.userService.isActive(userId)
  }

  async resendNotification(
    notification: unknown,
    config: unknown,
    attachmentGenerator: unknown,
  ): Promise<{ to: string; status: string; data: Record<string, unknown> }> {
    throw new Error('Method not implemented.')
  }

  private findService(event: string): IEmailTemplateDataService {
    switch (event) {
      case UserService.Events.REGISTERED:
      case UserService.Events.PASSWORD_RESET:
      case UserService.Events.UPDATED_LOGIN_INFO:
      case UserService.Events.UPDATED_LOGIN_INFO_PASSWORD:
      case UserService.Events.PASSWORD_RESET_COMPLETE:
        return this.container.userService
      case InquiryService.Events.CREATED:
        return this.container.inquiryService
      case CustomerService.Events.CREATED:
        return this.container.customerService
      case StoreService.Events.CREATED:
      case StoreService.Events.RETURN_GUARANTEE_COMPLETE:
      case StoreService.Events.PHOTO_SERVICE_COMPLETE:
        return this.container.storeService
      case OrderService.Events.SETTLED:
      case OrderService.Events.SETTLED_SHOP:
      case OrderService.Events.REQUEST_CANCEL:
      case OrderService.Events.CANCEL_COMPLETE:
      case OrderService.Events.SHIPMENT_COMPLETE:
      case OrderService.Events.COMPLETED:
      case OrderService.Events.ORDER_RETURN_REQUESTED:
      case OrderService.Events.CANCEL_COMPLETE_SHOP:
        return this.container.orderService
      case ChattingService.Events.SEND_CHAT_MAIL:
        return this.container.chattingService
      case RestockRequestService.Events.RESTOCK_REQUEST_SHOP:
      case RestockRequestService.Events.RESTOCK_REQUEST_USER:
      case RestockRequestService.Events.RESTOCK_VARIANT_ANNOUNCE:
        return this.container.restockRequestService
      case ProductSaleService.Events.PRODUCT_SALE:
        return this.container.productSaleService
      case WithdrawalService.Events.CREATED:
        return this.container.withdrawalService
      case DeliveryRequestService.Events.SEND_MAIL:
      case DeliveryRequestService.Events.ARRIVED:
      case DeliveryRequestService.Events.QUANTITY_CONFIRM:
      case DeliveryRequestService.Events.PUBLISHED:
        return this.container.deliveryRequestService
      case ProductReviewsService.Events.REVIEW_MAIL:
        return this.container.productReviewsService
      case ReturnService.Events.RECEIVE:
        return this.container.returnService
      case ReturnDeliveryService.Events.REQUESTED:
      case ReturnDeliveryService.Events.SHIPPED:
        return this.container.returnDeliveryService
      case PointService.Events.CUSTOMER_EXPIRE_POINT:
        return this.container.pointService
      case CampaignRequestService.Events.CREATE:
        return this.container.campaignRequestService
      default:
        return null
    }
  }

  async send({
    to,
    format,
    data,
    bcc = [],
    attachments = [],
  }: EmailTemplateData) {
    const emailData = await this.render(format, data)
    this.logger.debug(
      `[MailService] Sending email from ${JSON.stringify(
        this.from,
      )} to ${to} with: ${JSON.stringify(emailData)} by ${
        !!this.transporter ? 'SES' : 'SendGrid'
      }`,
    )

    const convertedAttachments = await Promise.all(
      attachments.map(async (a) => {
        const stream = await this.uploadService_.getS3Stream(a.s3Key, a.bucket)
        return {
          Filename: a.fileName,
          Content: stream,
        }
      }),
    )

    const toBcc = emailData.bcc || bcc

    if (!this.transporter) {
      // convert stream data to base64 string
      // so that sendgrid can send attachments
      const base64Attachments = await Promise.all(
        convertedAttachments.map(async (a) => {
          const base64 = await streamToBase64(a.Content)
          return {
            content: base64 as string,
            filename: a.Filename,
          }
        }),
      )
      // sendgrid
      return sgMail.send({
        to,
        from: this.from,
        bcc: toBcc,
        ...emailData,
        attachments: base64Attachments,
      })
    }

    const bufferAttachments = await Promise.all(
      convertedAttachments.map(async (a) => {
        const buffer = await streamToBuffer(a.Content)
        return {
          content: buffer as Buffer,
          filename: a.Filename,
        }
      }),
    )

    // aws ses
    return await this.transporter.sendMail({
      from: `${this.from.name} <${this.from.email}>`, // つなぐマーケット <qpa.tester@gmail.com>
      to: Array.isArray(to) ? to : [to],
      bcc: toBcc,
      subject: emailData.subject,
      html: emailData.html,
      attachments: bufferAttachments.map((at) => ({
        filename: at.filename,
        content: at.content,
      })),
    })
  }

  private async render(format: string, data?: object | any) {
    const year = new Date().getFullYear()

    const config = loadConfig()
    const frontUrl = new URL(config.frontendUrl.base)

    // console.log(config)

    let html: string
    let subject: string
    let bcc: string
    switch (format) {
      case 'user-register':
        html = render(
          <UserRegister
            link={`${frontUrl.protocol}//${data.data.link}`}
            expiresAt={data.data.expiresAt}
            year={year as any}
          />,
        )
        subject = '【つなぐマーケット】会員登録 URL のご案内'
        break
      case 'user-reset-password':
        html = render(
          <UserResetPassword
            nickname={data.data.nickname}
            link={data.data.link}
            expiresAt={data.data.expiresAt}
            year={year as any}
          />,
        )
        subject = '【つなぐマーケット】パスワードの再設定の URL のご案内'
        break
      case 'register-store-standard-complete':
        html = render(<RegisterStoreStandardComplete year={year as any} />)
        subject = '【つなぐマーケット】出店者登録を受け付けました'
        break
      case 'register-store-premium-complete':
        html = render(<RegisterStorePremiumComplete year={year as any} />)
        subject = '【つなぐマーケット】出店者登録を受け付けました'
        break
      case 'membership-register':
        html = render(
          <MembershipRegister
            nickname={data.data.nickname}
            email={data.data.email}
            year={year as any}
            shop_register_link={`${config.frontendUrl.base}/mypage/shop-register`}
          />,
        )
        subject = '【つなぐマーケット】会員登録が完了しました'
        break
      case 'buyer-message-reception':
        html = render(
          <BuyerMessageReception
            storeName={data.storeName}
            buyerName={data.buyerName}
            messageContent={data.messageContent}
            chattingThreadLink={data.chattingThreadLink}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】${data.storeName}さんからメッセージが届いています`
        break
      case 'shop-message-reception':
        html = render(
          <ShopMessageReception
            ownerName={data.ownerName}
            buyerName={data.buyerName}
            messageContent={data.messageContent}
            chattingThreadLink={data.chattingThreadLink}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】${data.buyerName}さんからメッセージが届きました`
        break
      case 'reset-password-complete':
        html = render(
          <ResetPasswordComplete
            contactLink={data.data.contactLink}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】パスワードの再設定が完了しました`
        break
      case 'user-updated-login-info':
        html = render(
          <UserUpdatedLoginInfo
            nickname={data.data.nickname}
            oldEmail={data.data.oldEmail}
            newEmail={data.data.newEmail}
            contactLink={data.data.contactLink}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】メールアドレスを変更しました`
        break
      case 'user-updated-login-info-password':
        html = render(
          <UserUpdatedLoginInfoPassword
            nickname={data.data.nickname}
            contactLink={data.data.contactLink}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】パスワードの変更が完了しました`
        break
      case 'inquiry-contact':
        html = render(
          <InquiryContact
            last_name={data.last_name}
            first_name={data.first_name}
            last_name_kana={data.last_name_kana}
            first_name_kana={data.first_name_kana}
            email={data.email}
            phone={data.phone}
            inquiry_type={data.inquiry_type}
            content={data.content}
            year={year as any}
          />,
        )
        subject = '【つなぐマーケット】お問い合わせを受け付けました'
        break
      case 'order-cancel-complete':
        html = render(
          <OrderCancelComplete
            created_at={data.order.created_at}
            nickname={data.order.customer.nickname}
            id={data.order.id}
            display_id={data.order.display_id}
            purchaseHistoryLink={data.purchaseHistoryLink}
            pointListLink={data.pointListLink}
            contactLink={data.contactLink}
            year={year as any}
          />,
        )
        subject = '【つなぐマーケット】ご注文のキャンセルに関しまして'
        break
      case 'order-completion':
        html = render(<OrderCompletion order={data.order} year={year as any} />)
        subject = '【つなぐマーケット】ご注文ありがとうございました'
        break
      case 'order-completion-shop':
        html = render(
          <OrderCompletionShop order={data.order} year={year as any} />,
        )
        subject = `【つなぐマーケット】作品が購入されました${data.order.display_id}T`
        break
      case 'order-completion-prime':
        html = render(
          <OrderCompletionPrime order={data.order} year={year as any} />,
        )
        subject = `【つなぐマーケット】作品が購入されました${data.order.display_id}T`
        break
      case 'order-request-cancel':
        html = render(
          <OrderRequestCancel
            order={data.order}
            parentDisplayId={data.order.display_id}
            purchaseHistoryDetailLink={data.purchaseHistoryDetailLink}
            contactLink={data.contactLink}
            year={year as any}
          />,
        )
        subject = '【つなぐマーケット】ご注文キャンセルの同意をお願いいたします'
        break
      case 'order-shipment-complete':
        html = render(
          <OrderShipmentComplete
            order={data.order}
            purchase_history_detail_link={data.purchase_history_detail_link}
            contact_link={data.contact_link}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】作品を発送いたしました 注文 ${data.order.display_id}T`
        break
      case 'order-return-request':
        html = render(
          <ReturnPurchaseRequest
            order={data.order}
            reason={data.reason}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】返品申請を受け付けました`
        bcc = config.email.email_admin
        break
      case 'product-restock-request-shop':
        html = render(
          <RestockRequestShop
            nickname={data.nickname}
            product={data.product}
            sku={data.sku}
            year={year as any}
            reason={data.reason}
          />,
        )
        subject = `【つなぐマーケット】作品再入荷リクエストのお知らせ`
        break

      case 'product-restock-request-user':
        html = render(
          <RestockRequestUser
            nickname={data.nickname}
            product={data.product}
            sku={data.sku}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】再入荷リクエストを受け付けました`
        break
      case 'product-restock-variant-announce':
        html = render(
          <RestockVariantAnnouce
            nickname={data.nickname}
            product={data.product}
            sku={data.sku}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】作品再入荷のお知らせ`
        break

      case 'store-return-guarantee-complete':
        html = render(
          <ReturnGuaranteeComplete
            store={data.store}
            contract={data.contract}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】返品保証サービスのお申込みを受け付けました`
        bcc = config.email.email_admin
        break

      case 'store-photo-service-complete':
        html = render(
          <PhotoServiceComplete
            store={data.store}
            contract={data.contract}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】撮影サービスのお申込みを受け付けました`
        bcc = config.email.email_admin
        break

      case 'send-email-product-sale':
        html = render(
          <FavoriteProductOnSale
            product={data.product}
            year={year as any}
            nickname={data.nickname}
            salePrice={data.salePrice}
          />,
        )
        subject = `【つなぐマーケット】お気に入り作品がセール価格になりました`
        break

      case 'withdrawal-premium-created':
        html = render(
          <WithdrawalPremiumComplete
            id={data.id}
            nickname={data.nickname}
            note={data.note}
            reasons={data.reasons}
            year={year as any}
            store_id={data.store_id}
          />,
        )
        subject = `【つなぐマーケット】退会申請が完了しました  `
        bcc = config.email.email_admin
        break

      case 'withdrawal-customer-created':
        html = render(
          <WithdrawalCustomerComplete
            id={data.id}
            nickname={data.nickname}
            note={data.note}
            reasons={data.reasons}
            year={year as any}
            isStore={data.isStore}
            store_id={data.store_id}
          />,
        )
        subject = `【つなぐマーケット】退会が完了しました  `
        break

      case 'delivery-request-shop':
        html = render(
          <DeliveryRequestShop delivery={data} year={year as any} />,
        )
        subject = `【つなぐマーケット】納品申請を受け付けました`
        bcc = config.email.email_admin
        break
      case 'review-complete-shop':
        html = render(
          <ReviewCompleteShop
            order={data.order}
            reviews={data.reviews}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】${data.order.customer.nickname}様からレビューが届いています`
        bcc = config.email.email_admin
        break
      case 'cancel-order-complete-shop':
        html = render(
          <CancelOrderCompleteShop order={data.order} year={year as any} />,
        )
        subject = `【つなぐマーケット】ご購入者よりキャンセル同意のご連絡`
        break
      case 'delivery-request-confirm-quantity':
        html = render(
          <DeliveryRequestConfirmQuantity
            deliveryRequest={data}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】納品数のご確認をお願いいたします`
        break
      case 'delivery-request-arrived':
        html = render(
          <DeliveryRequestArrived deliveryRequest={data} year={year as any} />,
        )
        subject = `【つなぐマーケット】納品が完了しました`
        break
      case 'delivery-request-published':
        html = render(
          <DeliveryRequestPublished
            deliveryRequest={data}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】返却依頼を受け付けました`
        break
      case 'return-receive':
        html = render(<ReturnReceive returnRequest={data} year={year as any} />)
        subject = `【つなぐマーケット】返却依頼の作品を発送しました`
        break
      case 'return-delivery-requested-shop':
        html = render(
          <ReturnDeliveryRequested
            returnDeliveries={data}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】返却依頼を受け付けました`
        break
      case 'return-delivery-shipped-shop':
        html = render(
          <ReturnDeliveryShipped returnDeliveries={data} year={year as any} />,
        )
        subject = `【つなぐマーケット】返却依頼の作品を発送しました`
        break
      case 'point-expire-customer':
        html = render(
          <PointExpireCustomer
            pointHistories={data.pointHistories}
            total={data.total}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】ポイント有効期限のお知らせ`
        break
      case 'campaign-request-shop':
        html = render(
          <CampaignRequestShop
            campaignRequest={data.campaignRequest}
            price={data.price}
            year={year as any}
          />,
        )
        subject = `【つなぐマーケット】1作品成約手数料無料キャンペーン申請を受け付けました`
        break
      default:
        const template = await memoizedReadfile(
          path.join(process.cwd(), 'templates', `${format}.md`),
          'utf8',
        )
        const md = render(template, data).trim()

        const firtLineEnd = md.indexOf('\n')
        subject =
          data['subject'] ?? md.substring(0, firtLineEnd).replace('# ', '')
        html = marked(md.substring(firtLineEnd + 1))
        break
    }

    return { subject, html, bcc }
  }
}
