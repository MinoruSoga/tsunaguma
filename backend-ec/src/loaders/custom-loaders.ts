import extendedExpressLoader from '../loaders/express'
import extendedPassportLoader from '../loaders/passport'

export default async function () {
  const expressLoader = await import('@medusajs/medusa/dist/loaders/express')
  expressLoader.default = extendedExpressLoader
  const passportLoader = await import('@medusajs/medusa/dist/loaders/passport')
  passportLoader.default = extendedPassportLoader
  const searchIndexLoader = await import(
    '@medusajs/medusa/dist/loaders/search-index'
  )
  searchIndexLoader.default = async () => {
    return
  }

  await import('./complete-order')
  await import('./reset-data')
  await import('./product-sale')
}
