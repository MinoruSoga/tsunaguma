/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  AbstractPaymentService,
  Payment,
  PaymentSession,
  PaymentSessionStatus,
} from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import GMOPG, {
  ENUMS,
  ExecTranArgs,
  JobCd,
  SearchTradeResult,
  Status,
} from 'gmopg'
import { EntityManager } from 'typeorm'
import { v4 as uuid } from 'uuid'

import loadConfig from '../helpers/config'
import { GMO_CARD_ID } from '../helpers/constant'
import { Cart } from './../modules/cart/entity/cart.entity'
import { GmoMemberRepository } from './../modules/user/repository/gmo-member.repository'
import { GmoService } from './../modules/user/services/gmo.service'

type InjectionDependencies = {
  manager: EntityManager
  logger: Logger
  gmoService: GmoService
  gmoMemberRepository: typeof GmoMemberRepository
}

type PaymentSessionData = {
  accessId?: string
  accessPass?: string
  amount: number
  orderId: string
  // customer_id: string
  memberId?: string
}

type AuthorizePaymentResult = {
  status: PaymentSessionStatus
  data: PaymentSessionData
}

type AuthorizeType = 'member' | 'token'

function initGmo() {
  const config = loadConfig()
  return new GMOPG({
    baseUrl: config.gmo.baseUrl,
    SiteID: config.gmo.siteID,
    SitePass: config.gmo.sitePass,
    ShopID: config.gmo.shopID,
    ShopPass: config.gmo.shopPass,
  })
}

class GMOCardPaymentService extends AbstractPaymentService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static identifier = GMO_CARD_ID

  private logger_: Logger
  protected gmoService: GmoService
  private gmopg: ReturnType<typeof initGmo>
  protected gmoMemberRepository: typeof GmoMemberRepository

  constructor(container: InjectionDependencies, options) {
    super(container)
    this.logger_ = container.logger
    this.manager_ = container.manager
    this.gmoMemberRepository = container.gmoMemberRepository
    this.gmoService = container.gmoService

    this.gmopg = initGmo()
  }

  /**
   * Returns the currently held status.
   * @param {object} paymentData - payment method data from cart
   * @returns {string} the status of the payment
   */
  async getStatus(
    paymentData: PaymentSessionData,
  ): Promise<PaymentSessionStatus> {
    const result = await this.retrievePayment(paymentData)
    switch (result.Status) {
      case Status.Unprocessed:
      case Status.Authenticated:
        return PaymentSessionStatus.PENDING

      case Status.Auth:
      case Status.Capture:
      case Status.Sales:
      case Status.Sauth:
      case Status.Check:
        return PaymentSessionStatus.AUTHORIZED

      case Status.Void:
      case Status.Cancel:
      case Status.Return:
      case Status.Returnx:
        return PaymentSessionStatus.CANCELED

      default:
        return PaymentSessionStatus.PENDING
    }
  }

  /**
   * Creates a manual payment with status "pending"
   * @param {object} cart - cart to create a payment for
   * @returns {object} an object with status
   */
  async createPayment(cart: Cart): Promise<PaymentSessionData> {
    try {
      const { customer_id, total } = cart
      const gmoOrderID = cart.id.replace('cart_', '')

      // check if cart total = 0, gmo does not allow order with total = 0
      // so not call gmo, just return
      if (total === 0) {
        return {
          amount: 0,
          orderId: gmoOrderID,
        }
      }

      const res = await this.gmopg.entryTran({
        OrderID: gmoOrderID,
        Amount: cart.total,
        JobCd: JobCd.Auth,
      })

      // check if customer is a gmo member or not
      let gmoMemberId
      const gmoMemberRepo = this.manager_.getCustomRepository(
        this.gmoMemberRepository,
      )
      const gmoMember = await gmoMemberRepo.findOne({
        where: { user_id: customer_id },
      })
      if (gmoMember) {
        gmoMemberId = gmoMember.member_id
      } else {
        // if this customer is not a gmo member => create member
        const newGmoMember = await this.gmopg.saveMember({
          SiteID: this.gmopg.config.SiteID,
          SitePass: this.gmopg.config.SitePass,
          MemberID: uuid(),
        })

        // save the new gmo member to db
        await gmoMemberRepo.save(
          gmoMemberRepo.create({
            member_id: newGmoMember.MemberID,
            user_id: customer_id,
          }),
        )
        gmoMemberId = newGmoMember.MemberID
      }

      // return AccessId and Access Pass
      return {
        accessId: res.AccessID,
        accessPass: res.AccessPass,
        amount: cart.total,
        orderId: gmoOrderID,
        memberId: gmoMemberId,
      }
    } catch (error) {
      throw error
    }
  }

  async createPaymentNew(paymentInput = {}) {
    return { status: 'pending', ...paymentInput }
  }

  /**
   * Retrieves GMO Card payment intent.
   * @param {PaymentData} paymentData - the data of the payment to retrieve
   * @return {Promise<Data>} GMO Card payment intent
   */
  async retrievePayment(data: PaymentSessionData): Promise<SearchTradeResult> {
    try {
      const result = await this.gmopg.searchTrade({ OrderID: data.orderId })
      return result
    } catch (error) {
      throw error
    }
  }

  /**
   * Updates the payment status to authorized
   * @param {PaymentSession} paymentSession - payment session data
   * @returns {Promise<{ status: string, data: object }>} result with data and status
   */
  async authorizePayment(
    paymentSession: PaymentSession,
  ): Promise<AuthorizePaymentResult> {
    try {
      const paymentSessionData = paymentSession.data as PaymentSessionData
      if (paymentSessionData.amount === 0) {
        return {
          data: paymentSessionData,
          status: PaymentSessionStatus.AUTHORIZED,
        }
      }

      const stat = await this.getStatus(paymentSessionData)
      return { data: paymentSessionData, status: stat }
    } catch (error) {
      throw error
    }
  }

  async authorizePaymentNew(
    paymentSession: PaymentSession,
    context: {
      token?: string
      type: AuthorizeType
      cardSeq?: string
      memberId?: string
    },
  ): Promise<AuthorizePaymentResult> {
    const sessionData = paymentSession.data as PaymentSessionData

    // if cart total is 0 => just return authorized status, not call gmo
    if (sessionData.amount === 0) {
      return {
        status: PaymentSessionStatus.AUTHORIZED,
        data: sessionData,
      }
    }

    const currentStat = await this.getStatus(sessionData)

    // if current cart is authorized => return
    if (currentStat === PaymentSessionStatus.AUTHORIZED) {
      //@ts-ignore
      return { stat: currentStat, data: sessionData }
    }

    const execTranArgs: ExecTranArgs = {
      AccessID: sessionData.accessId,
      AccessPass: sessionData.accessPass,
      OrderID: sessionData.orderId,
      Method: ENUMS.Method.Lump,
      SeqMode: ENUMS.SeqMode.Logic,
      SiteID: this.gmopg.config.SiteID,
      SitePass: this.gmopg.config.SitePass,
    }

    try {
      // save card for the customer when they use token authorization
      if (context.type === 'token' && sessionData.memberId) {
        const saveCardRes = await this.gmopg.saveCard({
          SiteID: this.gmopg.config.SiteID,
          SitePass: this.gmopg.config.SitePass,
          Token: context.token,
          MemberID: sessionData.memberId,
        })

        execTranArgs.MemberID = sessionData.memberId
        execTranArgs.CardSeq = Number(saveCardRes.CardSeq)
      } else {
        execTranArgs.MemberID = context.memberId
        execTranArgs.CardSeq = Number(context.cardSeq)
      }

      // authen this payment session
      await this.gmopg.execTran(execTranArgs)

      // and then update the amount of that payment session to gmo
      const res = await this.retrievePayment(sessionData)

      if (sessionData.amount !== Number(res.Amount) && sessionData.amount > 0) {
        await this.gmopg.changeTran({
          AccessID: sessionData.accessId,
          AccessPass: sessionData.accessPass,
          Amount: sessionData.amount,
          JobCd: JobCd.Auth,
        })
      }

      const stat = await this.getStatus(sessionData)
      return {
        status: stat,
        data: sessionData,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Noop, simply returns existing data.
   * @param {object} sessionData - payment session data. (session data cũ của payment session)
   * @returns {object} same data
   */
  async updatePayment(
    sessionData: PaymentSessionData,
    cart: Cart,
  ): Promise<PaymentSessionData> {
    try {
      // check if order is call gmo or not (case cart with total = 0)
      if (!sessionData.accessId) {
        // not call gmo already => create payment
        return await this.createPayment(cart)
      }

      if (cart.total && sessionData.amount === Math.round(cart.total)) {
        return sessionData
      }

      const stat = await this.getStatus(sessionData)

      // if payment gmo is not settled, then return session data with new total
      if (stat === PaymentSessionStatus.PENDING || cart.total === 0)
        return { ...sessionData, amount: cart.total }

      await this.gmopg.changeTran({
        AccessID: sessionData.accessId,
        AccessPass: sessionData.accessPass,
        Amount: cart.total,
        JobCd: JobCd.Auth,
      })

      return { ...sessionData, amount: cart.total }
    } catch (error) {
      throw error
    }
  }

  async updatePaymentNew(
    sessionData: PaymentSessionData,
  ): Promise<PaymentSessionData> {
    try {
      return sessionData
    } catch (error) {
      throw error
    }
  }

  /**
   .
   * @param {object} sessionData - payment session data.
   * @param {object} update - payment session update data.
   * @returns {object} existing data merged with update data
   */
  async updatePaymentData(
    sessionData: PaymentSessionData,
    updatedData: any = {},
  ): Promise<PaymentSessionData> {
    try {
      return { ...sessionData, ...updatedData }
    } catch (error) {
      throw error
    }
  }

  // not support
  async deletePayment(paymentSession: PaymentSession) {
    try {
      // await this.gmopg.alterTran({
      //   AccessID: paymentSession.data?.AcessID as string,
      //   AccessPass: paymentSession.data?.AccessPass as string,
      //   JobCd: JobCd.Void,
      // })
      return
    } catch (error) {
      throw error
    }
  }

  /**
   * Updates the payment status to captured
   * @param {object} paymentData - payment method data from cart
   * @returns {object} object with updated status
   */
  async capturePayment(payment: Payment): Promise<PaymentSessionData> {
    const sessionData = payment.data as PaymentSessionData
    try {
      await this.gmopg.alterTran({
        AccessID: sessionData?.accessId,
        AccessPass: sessionData?.accessPass,
        JobCd: JobCd.Sales,
        Amount: sessionData.amount,
      })

      return sessionData
    } catch (error) {
      throw error
    }
  }

  /**
   * Returns the data currently held in a status
   * @param {object} paymentData - payment method data from cart
   * @returns {object} the current data
   */
  async getPaymentData(paymentSession: PaymentSession) {
    return paymentSession.data
  }

  /**
   * Noop, resolves to allow manual refunds.
   * @param {object} payment - payment method data from cart
   * @returns {string} same data
   */
  async refundPayment(payment: Payment, refundAmount: number) {
    return payment.data
  }

  /**
   * Updates the payment status to cancled
   * @returns {object} object with canceled status
   */
  async cancelPayment(payment: Payment): Promise<PaymentSessionData> {
    const sessionData = payment.data as PaymentSessionData
    const stat = await this.getStatus(sessionData)

    if (
      stat === PaymentSessionStatus.CANCELED ||
      stat === PaymentSessionStatus.PENDING
    )
      return sessionData

    try {
      await this.gmopg.alterTran({
        AccessID: sessionData?.accessId,
        AccessPass: sessionData?.accessPass,
        JobCd: JobCd.Void,
      })

      return sessionData
    } catch (error) {
      throw error
    }
  }
}

export default GMOCardPaymentService
