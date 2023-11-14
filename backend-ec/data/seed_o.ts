// import { User } from './../src/modules/user/user.entity'

const { createConnection } = require('typeorm')

;(async () => {
  const connection = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'medusa-docker',
  })

  const manager = await connection.manager

  // // add users
  await manager.query(`
      INSERT INTO public.user ("id", "email", "password_hash", "type", "nickname", "status")
      VALUES ('usr_01G1G5V26F5TB3GPAPNJ8X1S3V', 'customer@medusa-test.com', 'c2NyeXB0AAEAAAABAAAAAYBClnQu1VCW62R2aly1ZCAo+xJgs0DTh8SwOfB7RBMzKtVTywrHg6ypVIOXzNCrRPp2lsHulGrm4YZtImKXxQ0BFE2CvUBaf5UZdpKnxRnp', 'customer', 'tng-customer', 'active')
  `)
  await manager.query(`
      INSERT INTO public.user ("id", "email", "password_hash", "type", "nickname", "status")
      VALUES ('usr_02G1G5V26F5TB3GPAPNJ8X1S3V', 'seller@medusa-test.com', 'c2NyeXB0AAEAAAABAAAAAYBClnQu1VCW62R2aly1ZCAo+xJgs0DTh8SwOfB7RBMzKtVTywrHg6ypVIOXzNCrRPp2lsHulGrm4YZtImKXxQ0BFE2CvUBaf5UZdpKnxRnp', 'store_standard', 'tng-seller', 'active')
  `)

  // // add customers
  await manager.query(`
      INSERT INTO public.customer ("id", "email", "password_hash")
      VALUES ('usr_01G1G5V26F5TB3GPAPNJ8X1S3V', 'customer@medusa-test.com', 'c2NyeXB0AAEAAAABAAAAAYBClnQu1VCW62R2aly1ZCAo+xJgs0DTh8SwOfB7RBMzKtVTywrHg6ypVIOXzNCrRPp2lsHulGrm4YZtImKXxQ0BFE2CvUBaf5UZdpKnxRnp')
  `)
  await manager.query(`
      INSERT INTO public.customer ("id", "email", "password_hash")
      VALUES ('usr_02G1G5V26F5TB3GPAPNJ8X1S3V', 'seller@medusa-test.com', 'c2NyeXB0AAEAAAABAAAAAYBClnQu1VCW62R2aly1ZCAo+xJgs0DTh8SwOfB7RBMzKtVTywrHg6ypVIOXzNCrRPp2lsHulGrm4YZtImKXxQ0BFE2CvUBaf5UZdpKnxRnp')
  `)

  // add regions
  await manager.query(`
      INSERT INTO public.region ("id", "name", "currency_code", "tax_rate")
      VALUES ('test-region-jp', 'JP', 'jpy', 0)
  `)
  await manager.query(`
      INSERT INTO public.region ("id", "name", "currency_code", "tax_rate")
      VALUES ('test-region-na', 'NA', 'usd', 0)
  `)

  // add stores
  await manager.query(`
    INSERT INTO public.store_detail ("id", "gender", "post_code", "prefecture_id", "addr_01", "addr_02", "tel_number", "birthday", "firstname", "lastname", "firstname_kana", "lastname_kana", "company_name", "company_name_kana", "compliance_1", "compliance_2")
    VALUES ('store_01G1G5V21KADXNGH29BJMAJ4B5','male', '1234-5678', 'pref_1', 'addr_01', 'addr_02', '0123456789', '2020-01-01', 'a', 'b', 'c', 'd', 'pionero', 'pionero_kana', true, false)
  `)

  await manager.query(`
      INSERT INTO public.store ("id", "name", "plan_type", "business_form", "owner_id", "store_detail_id", "status", "slug")
      VALUES ('store_01G1G5V21KADXNGH29BJMAJ4B5', 'Medusa Store', 'standard', 'company', 'usr_02G1G5V26F5TB3GPAPNJ8X1S3V', 'store_01G1G5V21KADXNGH29BJMAJ4B5', 'approved', 'store_01G1G5V21KADXNGH29BJMAJ4B5')
  `)

  // alter user
  await manager.query(`
     UPDATE public.user as u
     SET store_id = 'store_01G1G5V21KADXNGH29BJMAJ4B5'
     WHERE u.id = 'usr_02G1G5V26F5TB3GPAPNJ8X1S3V'
  `)

  // add shipping profiles
  await manager.query(`
      INSERT INTO public.shipping_profile ("id", "name", "type", "store_id")
      VALUES ('sp_01G1G5V239ENSZ5MV4JAR737BM', 'Default Profile', 'default', 'store_01G1G5V21KADXNGH29BJMAJ4B5')
  `)

  // add fulfillment providers
  await manager.query(`
     INSERT INTO public.fulfillment_provider ("id", "name", "is_free", "is_trackable", "is_warranty", "metadata")
     VALUES ('fp_1', 'スマートレター', true, true, true, '{"sizes": [{"id": "fp_size_1", "name": "5kg"},{"id": "fp_size_2", "name": "10kg"},{"id": "fp_size_3", "name": "15kg"},{"id": "fp_size_4", "name": "20kg"}]}')
  `)
  await manager.query(`
     INSERT INTO public.fulfillment_provider ("id", "name", "is_free", "is_trackable", "is_warranty", "metadata")
     VALUES ('fp_2', 'ゆうパケット', false, true, false, '{"sizes": [{"id": "fp_size_1", "name": "5kg"},{"id": "fp_size_2", "name": "10kg"},{"id": "fp_size_3", "name": "15kg"},{"id": "fp_size_4", "name": "20kg"}]}')
  `)
  await manager.query(`
     INSERT INTO public.fulfillment_provider ("id", "name", "is_free", "is_trackable", "is_warranty", "metadata")
     VALUES ('fp_3', 'レターパック', false, false, false, '{"sizes": [{"id": "fp_size_1", "name": "5kg"},{"id": "fp_size_2", "name": "10kg"},{"id": "fp_size_3", "name": "15kg"},{"id": "fp_size_4", "name": "20kg"}]}')
  `)
  await manager.query(`
     INSERT INTO public.fulfillment_provider ("id", "name", "is_free", "is_trackable", "is_warranty", "metadata")
     VALUES ('fp_4', 'クリックポスト', true, false, true, '{"sizes": [{"id": "fp_size_1", "name": "5kg"},{"id": "fp_size_2", "name": "10kg"},{"id": "fp_size_3", "name": "15kg"},{"id": "fp_size_4", "name": "20kg"}]}')
  `)
})()
