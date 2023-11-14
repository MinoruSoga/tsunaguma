import { AbstractPaymentService, PaymentSessionStatus } from '@medusajs/medusa'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { EntityManager } from 'typeorm'

import { GMO_KOBINI_ID } from '../helpers/constant'

type InjectionDependencies = {
  manager: EntityManager
  logger: Logger
}

class KobiniPaymentService extends AbstractPaymentService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static identifier = GMO_KOBINI_ID

  private logger_: Logger

  constructor(container: InjectionDependencies, options) {
    super(container)
    this.logger_ = container.logger
    this.manager_ = container.manager
  }

  /**
   * Returns the currently held status.
   * @param {object} paymentData - payment method data from cart
   * @returns {string} the status of the payment
   */
  async getStatus(paymentData) {
    const { status } = paymentData
    return status
  }

  /**
   * Creates a manual payment with status "pending"
   * @param {object} cart - cart to create a payment for
   * @returns {object} an object with status
   */
  async createPayment(cart) {
    const intentRequest = {
      amount: cart.total,
      customer: cart.customer_id,
      metadata: { cart_id: cart.id },
    }
    return { status: 'pending', ...intentRequest }
  }

  async createPaymentNew(paymentInput = {}) {
    return { status: 'pending', ...paymentInput }
  }

  /**
   * Retrieves GMO Konini payment intent.
   * @param {PaymentData} paymentData - the data of the payment to retrieve
   * @return {Promise<Data>} GMO Konini payment intent
   */
  async retrievePayment(data) {
    return data
  }

  /**
   * Updates the payment status to authorized
   * @param {PaymentSession} paymentSession - payment session data
   * @returns {Promise<{ status: string, data: object }>} result with data and status
   */
  async authorizePayment(paymentSession) {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: { ...paymentSession, status: 'authorized' }, // data trả ra sẽ được lưu vào trường data của payment mới
    }
  }

  /**
   * Noop, simply returns existing data.
   * @param {object} sessionData - payment session data. (session data cũ của payment session)
   * @returns {object} same data
   */
  async updatePayment(sessionData, cart) {
    const updatedIntent = {
      amount: cart.total,
      customer: cart.customer_id,
      metadata: { cart_id: cart.id },
    }
    return { ...sessionData, ...updatedIntent } // trả ra data sẽ được lưu vào data field của payment session đang update
  }

  async updatePaymentNew(sessionData) {
    return sessionData
  }

  /**
   .
   * @param {object} sessionData - payment session data.
   * @param {object} update - payment session update data.
   * @returns {object} existing data merged with update data
   */
  async updatePaymentData(sessionData, update: any = {}) {
    return { ...sessionData.data, ...update.data }
  }

  async deletePayment() {
    return
  }

  /**
   * Updates the payment status to captured
   * @param {object} paymentData - payment method data from cart
   * @returns {object} object with updated status
   */
  async capturePayment(payment) {
    return { status: 'captured' }
  }

  /**
   * Returns the data currently held in a status
   * @param {object} paymentData - payment method data from cart
   * @returns {object} the current data
   */
  async getPaymentData(session) {
    return session.data
  }

  /**
   * Noop, resolves to allow manual refunds.
   * @param {object} payment - payment method data from cart
   * @returns {string} same data
   */
  async refundPayment(payment) {
    return payment.data
  }

  /**
   * Updates the payment status to cancled
   * @returns {object} object with canceled status
   */
  async cancelPayment() {
    return { status: 'canceled' }
  }
}

export default KobiniPaymentService
