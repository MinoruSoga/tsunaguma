import { Logger } from '@medusajs/medusa/dist/types/global'
import { MedusaContainer } from 'medusa-extender'

import { FEE_TRANFER } from '../helpers/constant'
import { EventBusService } from '../modules/event/event-bus.service'
import { OrderService } from '../modules/order/services/order.service'
import { Store } from '../modules/store/entity/store.entity'
import { TransferType } from '../modules/store/entity/store_billing.entity'
import { StorePaymentMethod } from '../modules/store/entity/store-detail.entity'
import StoreService from '../modules/store/services/store.service'

const billingStore = async (container: MedusaContainer) => {
  const logger = container.resolve<Logger>('logger')
  try {
    const eventBusService =
      container.resolve<EventBusService>('eventBusService')

    eventBusService.createCronJob(
      'billing-store',
      {},
      '30 0 * * *',
      async () => {
        const storeService = container.resolve<StoreService>('storeService')
        const orderService = container.resolve<OrderService>('orderService')
        const today = new Date()

        const stores = await storeService.list(
          {},
          { select: ['id', 'created_at'], relations: ['store_detail'] },
        )

        await Promise.all(
          stores.map(async (store: Store) => {
            const billing = await storeService.getStoreBilling(store.id)

            if (!billing) {
              let oldDate = store.created_at
              const oldBill = await storeService.getBillingExist(store.id)
              if (oldBill) {
                oldDate = oldBill.created_at
              }
              if (
                Math.abs(
                  Math.round(
                    (today.getTime() - oldDate.getTime()) /
                      1000 /
                      60 /
                      60 /
                      24 /
                      365.25,
                  ),
                ) >= 1
              ) {
                const billing = await orderService.getBillingStore(store.id)

                if (billing.total > FEE_TRANFER) {
                  const data = {
                    transfer_type:
                      store?.store_detail?.payment_method ===
                      StorePaymentMethod.AUTO
                        ? TransferType.AUTO
                        : TransferType.MANUAL,
                    total_origin_price: billing.total,
                    total_delivery_price: billing.shipping_total,
                    total_fee: billing.fee_total,
                    total_price: billing.subtotal - FEE_TRANFER,
                  }

                  await storeService.createdStoreBilling(store.id, data)
                }
              } else {
                if (
                  store?.store_detail?.payment_method ===
                  StorePaymentMethod.AUTO
                ) {
                  const billing = await orderService.getBillingStore(store.id)

                  if (billing.total >= 1000) {
                    const data = {
                      transfer_type:
                        store?.store_detail?.payment_method ===
                        StorePaymentMethod.AUTO
                          ? TransferType.AUTO
                          : TransferType.MANUAL,
                      total_origin_price: billing.total,
                      total_delivery_price: billing.shipping_total,
                      total_fee: billing.fee_total,
                      total_price: billing.subtotal - FEE_TRANFER,
                    }

                    await storeService.createdStoreBilling(store.id, data)
                  }
                }
              }
            } else {
              const bill = await orderService.getTotalOfBilling(billing.id)
              const data = {
                total_origin_price: bill.total,
                total_delivery_price: bill.shipping_total,
                total_fee: bill.fee_total,
                total_price: bill.subtotal - FEE_TRANFER,
              }
              await storeService.updateStoreBilling(billing.id, data)
            }
          }),
        ).catch(function (err) {
          logger.info(err.message)
        })
      },
    )
  } catch (error) {
    logger.error(error)
  }
}

export default billingStore
