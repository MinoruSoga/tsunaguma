#!/usr/bin/env node

const fs = require('fs')
const { default: OAS } = require('oas-normalize')
const swaggerInline = require('swagger-inline')

const isDryRun = process.argv.indexOf('--dry-run') !== -1

function fix(obj) {
  if (!obj) {
    return
  }
  if (Array.isArray(obj)) {
    obj.forEach((val) => fix(val))
  } else if (typeof obj === 'object') {
    if (obj.hasOwnProperty('properties') && !obj.hasOwnProperty('type')) {
      obj.type = 'object'
    } else if (obj.hasOwnProperty('requestBody')) {
      obj.requestBody.required = true
    } else if (obj.hasOwnProperty('/price-lists/{id}/products')) {
      const getProds = obj['/price-lists/{id}/products']
      const getProdsParams = getProds.get.parameters
      for (const params of getProdsParams) {
        if (params.in === 'path') {
          params.name = 'price_id'
          break
        }
      }
      obj['/price-lists/{price_id}/products'] = getProds
      delete obj['/price-lists/{id}/products']
    } else if (obj.hasOwnProperty('openapi')) {
      // change return model to ret model
      const schemas = obj.components.schemas
      schemas.ret = schemas.return
      schemas.ret['x-resourceId'] = 'ret'
      delete schemas.return
    } else if (
      obj.hasOwnProperty('$ref') &&
      obj['$ref'] === '#/components/schemas/return'
    ) {
      // change return model to ret model
      obj['$ref'] = '#/components/schemas/ret'
    }
    Object.keys(obj).forEach((key) => fix(obj[key]))
  }
}

// Storefront API
swaggerInline(
  [
    './node_modules/@medusajs/medusa/dist/models/*.ts',
    './node_modules/@medusajs/medusa/dist/api/middlewares/**/*.ts',
    './node_modules/@medusajs/medusa/dist/api/routes/store/**/*.ts',
    './src/modules/**/*.entity.ts',
    './src/modules/**/*.middleware.ts',
    './src/modules/**/*.store.controller.ts',
  ],
  {
    base: './client-sdk/medusa/docs/store-spec3-base.yaml',
    ignore: [],
    format: '.json',
  },
)
  .then((gen) => {
    const oas = new OAS(gen)
    oas
      .validate(true)
      .then(() => {
        if (!isDryRun) {
          const obj = JSON.parse(gen)
          fix(obj)
          fs.writeFileSync(
            './client-sdk/medusa/docs/store-spec3.json',
            JSON.stringify(obj, null, 2),
          )
        }
      })
      .catch((err) => {
        console.error('Error store validate:', err)
        process.exit(1)
      })
  })
  .catch((err) => {
    console.error('Error in store:', err)
    process.exit(1)
  })

swaggerInline(
  [
    './node_modules/@medusajs/medusa/dist/models/*.ts',
    './node_modules/@medusajs/medusa/dist/api/middlewares/**/*.ts',
    './node_modules/@medusajs/medusa/dist/api/routes/store/**/*.ts',
    './src/modules/**/*.entity.ts',
    './src/modules/**/*.middleware.ts',
    './src/modules/**/*.store.controller.ts',
  ],
  {
    base: './client-sdk/medusa/docs/store-spec3-base.yaml',
    ignore: [],
    format: '.yaml',
  },
)
  .then((gen) => {
    if (!isDryRun) {
      fs.writeFileSync('./client-sdk/medusa/docs/store-spec3.yaml', gen)
    } else {
      console.log('No errors occurred while generating Store API Reference')
    }
  })
  .catch((err) => {
    console.error('Error in store:', err)
    process.exit(1)
  })

// Admin API
swaggerInline(
  [
    './node_modules/@medusajs/medusa/dist/models/**/*.ts',
    './node_modules/@medusajs/medusa/dist/api/middlewares/**/*.ts',
    './node_modules/@medusajs/medusa/dist/api/routes/admin/**/*.ts',
    './src/modules/**/*.entity.ts',
    './src/modules/**/*.middleware.ts',
    './src/modules/**/*.admin.controller.ts',
  ],
  {
    base: './client-sdk/medusa/docs/admin-spec3-base.yaml',
    ignore: [],
    format: '.json',
  },
)
  .then((gen) => {
    const oas = new OAS(gen)
    oas
      .validate(true)
      .then(() => {
        if (!isDryRun) {
          const obj = JSON.parse(gen)
          fix(obj)
          fs.writeFileSync(
            './client-sdk/medusa/docs/admin-spec3.json',
            JSON.stringify(obj, null, 2),
          )
        }
      })
      .catch((err) => {
        console.error('Error in admin validate', err)
        process.exit(1)
      })
  })
  .catch((err) => {
    console.error('Error in admin:', err)
    process.exit(1)
  })

swaggerInline(
  [
    './node_modules/@medusajs/medusa/dist/models/**/*.ts',
    './node_modules/@medusajs/medusa/dist/api/middlewares/**/*.ts',
    './node_modules/@medusajs/medusa/dist/api/routes/admin/**/*.ts',
    './src/modules/**/*.entity.ts',
    './src/modules/**/*.middleware.ts',
    './src/modules/**/*.admin.controller.ts',
  ],
  {
    base: './client-sdk/medusa/docs/admin-spec3-base.yaml',
    ignore: [],
    format: '.yaml',
  },
)
  .then((gen) => {
    if (!isDryRun) {
      fs.writeFileSync('./client-sdk/medusa/docs/admin-spec3.yaml', gen)
    } else {
      console.log('No errors occurred while generating Admin API Reference')
    }
  })
  .catch((err) => {
    console.error('Error in admin:', err)
    process.exit(1)
  })
