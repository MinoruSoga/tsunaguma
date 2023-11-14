import { AbstractPaymentService } from '@medusajs/medusa'
import { PaymentRepository } from '@medusajs/medusa/dist/repositories/payment'
import { PaymentProviderRepository } from '@medusajs/medusa/dist/repositories/payment-provider'
import { PaymentSessionRepository } from '@medusajs/medusa/dist/repositories/payment-session'
import { RefundRepository } from '@medusajs/medusa/dist/repositories/refund'
import { RegionRepository } from '@medusajs/medusa/dist/repositories/region'
import { PaymentProviderService as MedusaPaymentProviderService } from '@medusajs/medusa/dist/services'
import { Service } from 'medusa-extender'
import BasePaymentService from 'medusa-interfaces/dist/payment-service'
import { EntityManager } from 'typeorm'

import { EAST_ASIA_REGION_ID } from '../../../helpers/constant'

type PaymentProviderKey = `pp_${string}` | 'systemPaymentProviderService'

type InjectedDependencies = {
  manager: EntityManager
  paymentSessionRepository: typeof PaymentSessionRepository
  paymentProviderRepository: typeof PaymentProviderRepository
  paymentRepository: typeof PaymentRepository
  refundRepository: typeof RefundRepository
  regionRepository: typeof RegionRepository
} & {
  [key in `${PaymentProviderKey}`]:
    | AbstractPaymentService
    | typeof BasePaymentService
}

@Service({ override: MedusaPaymentProviderService })
export class PaymentProviderService extends MedusaPaymentProviderService {
  protected manager_: EntityManager
  protected transactionManager_: EntityManager
  static resolutionKey = 'paymentProviderService'

  private readonly manager: EntityManager
  protected regionRepo_: typeof RegionRepository

  constructor(container: InjectedDependencies, private readonly config: any) {
    super(container)

    this.manager = container.manager
    this.regionRepo_ = container.regionRepository
  }

  async registerInstalledProviders(providerIds: string[]): Promise<void> {
    return await this.atomicPhase_(async (transactionManager) => {
      const model = transactionManager.getCustomRepository(
        this.paymentProviderRepository_,
      )
      const regionRepo = transactionManager.getCustomRepository(
        this.regionRepo_,
      )
      const manualProviderId = 'manual'

      await model.update({}, { is_installed: false })

      const providers = await Promise.all(
        providerIds.map(async (providerId) => {
          const provider = model.create({
            id: providerId,
            is_installed: true,
          })
          return await model.save(provider)
        }),
      )

      const targetRegion = await regionRepo.findOne({
        where: { id: EAST_ASIA_REGION_ID },
      })

      // remove manual provider
      await model.delete({ id: manualProviderId })

      if (targetRegion) {
        targetRegion.payment_providers = providers.filter(
          (p) => p.id !== manualProviderId,
        )
        await regionRepo.save(targetRegion)
      }
    })
  }
}
