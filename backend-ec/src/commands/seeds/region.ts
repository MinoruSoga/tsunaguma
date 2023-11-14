import { CurrencyRepository } from '@medusajs/medusa/dist/repositories/currency'
import { RegionRepository } from '@medusajs/medusa/dist/repositories/region'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { JAPANESE_CURRENCY_CODE } from '../../helpers/constant'

export default async function seedRegion(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const regionRepository = tx.getCustomRepository(
    container.resolve('regionRepository'),
  ) as RegionRepository
  const currencyRepository = tx.getCustomRepository(
    container.resolve('currencyRepository'),
  ) as CurrencyRepository

  const currency = await currencyRepository.save(
    currencyRepository.create({
      code: JAPANESE_CURRENCY_CODE,
      symbol: '¥',
      symbol_native: '円',
      name: 'Japanese Yen',
    }),
  )

  await regionRepository.save(
    regionRepository.create({
      name: 'East Asia',
      currency_code: currency.code,
      tax_rate: 0.08,
    }),
  )
}
