/* eslint-disable @typescript-eslint/no-unused-vars */
import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  registerDecorator,
  ValidationOptions,
} from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'
import { DeepPartial, EntityManager } from 'typeorm'

import {
  FREE_SHIP_AMOUNT_DEF,
  LOGGED_IN_USER_KEY,
  MARGIN_RATE_PRM,
  MARGIN_RATE_STD,
} from '../../../helpers/constant'
import { LoggedInUser } from '../../../interfaces/loggedin-user'
import { ShippingOptionService } from '../../../modules/shipping/services/shipping-option.service'
import { ShippingProfileService } from '../../../modules/shipping/services/shipping-profile.service'
import { isAdmin } from '../../../modules/user/constant'
import { FulfillmentProvider } from '../../shipping/entities/fulfillment-provider.entity'
import { FulfillmentProviderService } from '../../shipping/services/fulfillment-provider.service'
import UserService from '../../user/services/user.service'
import {
  Store,
  StoreBusinessForm,
  StorePhotoServiceEnum,
  StorePlanType,
  StoreStatus,
} from '../entity/store.entity'
import { Gender, StorePaymentMethod } from '../entity/store-detail.entity'
import StoreService from '../services/store.service'
import { StoreDetailService } from '../services/store-detail.service'
/**
 * @oas [post] /store/register/cms
 * operationId: "RegisterStoreCms"
 * summary: "Register a store cms"
 * description: "Creates a store for admin cms."
 * x-authenticated: true
 * requestBody:
 *  content:
 *    application/json:
 *      schema:
 *        $ref: "#/components/schemas/StoreRegisterAdminCms"
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Store
 * responses:
 *   201:
 *     description: Created
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 *
 */
const registerStoreCmsController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser
  const isUserAdmin = isAdmin(loggedInUser)

  if (!loggedInUser || !loggedInUser.id || !isUserAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not admin')
  }

  const validated = await validator(StoreRegisterAdminCms, req.body)
  const manager = req.scope.resolve('manager') as EntityManager
  const storeService = req.scope.resolve('storeService') as StoreService
  const userService = req.scope.resolve('userService') as UserService

  const storeDetailService = req.scope.resolve(
    'storeDetailService',
  ) as StoreDetailService

  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    'shippingOptionService',
  )

  const shippingProfileService: ShippingProfileService = req.scope.resolve(
    'shippingProfileService',
  )

  const fulfillmentProviderService: FulfillmentProviderService =
    req.scope.resolve('fulfillmentProviderService')

  const emailIp = validated.email

  const user = await userService.retrieveByEmail(emailIp)

  if (!user) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Email is not found')
  }

  const owner_id = user.id

  if (validated.company_name) {
    validated.business_form = StoreBusinessForm.CORPORATION
  } else {
    validated.business_form = StoreBusinessForm.INDIVIDUAL
  }

  const {
    email,
    plan_type,
    margin_rate,
    spec_rate,
    spec_starts_at,
    spec_ends_at,
    name,
    status,
    business_form,
    url,
    has_photo_service,
    is_return_guarantee,
    ...rest
  } = validated

  await manager.transaction(async (transactionManager) => {
    let storeDetail = await storeDetailService.retrieveByUser(user.id, false)
    if (!storeDetail) {
      storeDetail = await storeDetailService
        .withTransaction(transactionManager)
        .create({ ...rest, user_id: user.id })
    } else {
      await storeDetailService
        .withTransaction(transactionManager)
        .update(user.id, { ...rest, business_form })
    }

    const storeData: DeepPartial<Store> = {
      store_detail_id: storeDetail.id,
      plan_type,
      owner_id: owner_id,
      id: storeDetail.id,
      margin_rate,
      spec_rate,
      spec_starts_at,
      spec_ends_at,
      name,
      url,
      status: StoreStatus.APPROVED,
      business_form,
      has_photo_service,
      is_return_guarantee,
    }

    if (plan_type === StorePlanType.PRIME) {
      storeData.margin_rate = margin_rate || MARGIN_RATE_PRM
      storeData.is_return_guarantee = true
      storeData.photo_service_type = StorePhotoServiceEnum.BASIC
      storeData.has_photo_service = true
    } else {
      storeData.margin_rate = margin_rate || MARGIN_RATE_STD
    }

    const store = await storeService
      .withTransaction(transactionManager)
      .createStore(storeData)

    if (store.plan_type === StorePlanType.PRIME) {
      const profile = await shippingProfileService
        .withTransaction(transactionManager)
        .retrieveDefault(store.id)

      let fulfillment = await fulfillmentProviderService
        .withTransaction(transactionManager)
        .retrieveTitle('宅急便')

      if (!fulfillment) {
        const data: DeepPartial<FulfillmentProvider> = {
          store_id: null,
          name: '宅急便コンパクト',
          is_installed: true,
          is_free: false,
          is_warranty: true,
          is_trackable: true,
          metadata: {
            sizes: [
              {
                id: '1',
                name: '-',
              },
            ],
          },
        }
        fulfillment = await fulfillmentProviderService.create(data)
      }

      const shippingOption = {
        store_id: store.id,
        provider_id: fulfillment.id,
        profile_id: profile.id,
        name: '宅急便',
        data: { all: 600, prefs: null },
        size_id: '1',
        is_trackable: true,
        is_warranty: true,
        provider: {
          id: fulfillment.id,
          name: '宅急便',
        },
      }

      await shippingOptionService
        .withTransaction(transactionManager)
        .save(store.id, shippingOption)

      await storeService
        .withTransaction(transactionManager)
        .setFreeShippingStore(store.id, FREE_SHIP_AMOUNT_DEF)
    }

    // if (status === StoreStatus.APPROVED) {
    await storeService
      .withTransaction(transactionManager)
      .approveStoreReg(store.id)
    // }
  })
  res.sendStatus(201)
}

// string date format: (YYYY-MM-DD)
export function IsOnlyDate(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsOnlyDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Please provide only date like 2020-12-08',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          const regex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/
          return typeof value === 'string' && regex.test(value)
        },
      },
    })
  }
}

type ValidationNameOptions = ValidationOptions & {
  nameKeys: {
    ln_kanji: string
    fn_kanji: string
    ln_furi: string
    fn_furi: string
  }
}

// string date format: (YYYY-MM-DD)
export function IsValidName(validationOptions?: ValidationNameOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsOnlyDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Name is not valid',
        ...validationOptions,
      },
      validator: {
        validate(value: any, validationArgs) {
          const { fn_furi, fn_kanji, ln_furi, ln_kanji } =
            validationOptions.nameKeys
          const data: any = validationArgs.object

          if (
            !data[fn_furi] &&
            !data[ln_furi] &&
            !data[fn_kanji] &&
            !data[ln_kanji]
          )
            return false

          if (!data[fn_furi] && data[fn_kanji]) return false
          if (data[fn_furi] && !data[fn_kanji]) return false
          if (!data[ln_furi] && data[ln_kanji]) return false
          if (data[ln_furi] && !data[ln_kanji]) return false

          return true
        },
      },
    })
  }
}

/**
 * @schema StoreRegisterAdminCms
 * title: "Register Store Admin Cms Params"
 * description: "Register Store Admin Cms Params"
 * x-resourceId: StoreRegisterAdminCms
 * required:
 *  - name
 *  - plan_type
 *  - post_code
 *  - addr_01
 *  - addr_02
 *  - prefecture_id
 *  - tel_number
 *  - email
 * properties:
 *   name:
 *     type: string
 *   plan_type:
 *     $ref: "#/components/schemas/StorePlanTypeEnum"
 *   post_code:
 *     type: string
 *   addr_01:
 *     type: string
 *     maxLength: 16
 *     description: "Street name of the store"
 *   addr_02:
 *     type: string
 *     maxLength: 16
 *     description: "Building name of the store"
 *   prefecture_id:
 *     type: string
 *     description: "Prefecture id of the store"
 *   tel_number:
 *     type: string
 *     description: "Phone number of the seller"
 *   firstname:
 *     type: string
 *     description: "Kanji first nanme of the seller"
 *   lastname:
 *     type: string
 *     description: "Kanji last nanme of the seller"
 *   firstname_kana:
 *     type: string
 *     description: "Furigana first nanme of the seller"
 *   lastname_kana:
 *     type: string
 *     description: "Furigana last nanme of the seller"
 *   referral_code:
 *     type: string
 *   payment_method:
 *     $ref: "#/components/schemas/StorePaymentMethod"
 *   company_name:
 *     type: string
 *     description: "Kanji corporation name of the rep"
 *   company_name_kana:
 *     type: string
 *     description: "Furigana corporation name of the rep"
 *   email:
 *     type: string
 *     format: email
 *     description: email of user
 *     example: 1_user
 *   registration_number:
 *     type: string
 *   metadata:
 *     type: object
 *     description: An optional key-value map with additional details
 *     example: {car: "white"}
 *   margin_rate:
 *     type: number
 *   spec_rate:
 *     type: number
 *   spec_starts_at:
 *     type: string
 *     format: date-time
 *   spec_ends_at:
 *     type: string
 *     format: date-time
 *   is_return_guarantee:
 *     type: boolean
 *   status:
 *     $ref: "#/components/schemas/StoreStatusEnum"
 *   contact_firstname:
 *     type: string
 *     minLength: 16
 *     description: "Curator kanji first name"
 *   contact_lastname:
 *     type: string
 *     description: "Curator kanji first name"
 *   contact_firstname_kana:
 *     type: string
 *     description: "Curator furigana first name"
 *   contact_lastname_kana:
 *     type: string
 *     description: "Curator furigana last name"
 *   contact_tel:
 *     type: string
 *     description: "Curator's phone number"
 *   mobile_number:
 *     type: string
 *     description: "Mobile number of the seller"
 *   emerge_number:
 *     type: string
 *     description: "Emergency phone number number of the seller"
 *   business_form:
 *     $ref: "#/components/schemas/StoreBusinessFormEnum"
 *   company_official_name:
 *     type: string
 *   birthday:
 *     type: string
 *     format: date
 *     description: "Date of birth of the seller"
 *   has_photo_service:
 *     type: boolean
 */
export class StoreRegisterAdminCms {
  @IsString()
  name: string

  @IsEnum(StoreStatus, {
    always: true,
    message: `Invalid value (status must be one of following values: [${Object.values(
      StoreStatus,
    ).join(',')}])`,
  })
  @IsOptional()
  status: StoreStatus

  @IsOptional()
  @IsEnum(StoreBusinessForm, {
    always: true,
    message: `Invalid value (business_form must be one of following values: [${Object.values(
      StoreBusinessForm,
    ).join(',')}])`,
  })
  business_form: StoreBusinessForm

  @IsEnum(StorePlanType, {
    always: true,
    message: `Invalid value (plan_type must be one of following values: [${Object.values(
      StorePlanType,
    ).join(',')}])`,
  })
  plan_type: StorePlanType

  @IsString()
  post_code: string

  @IsString()
  @MaxLength(16, { message: 'Street name can not be more than 16 characters' })
  addr_01: string

  @IsString()
  @MaxLength(16, {
    message: 'Building name can not be more than 16 characters',
  })
  addr_02: string

  @IsString()
  prefecture_id: string

  @IsString()
  @Matches(/^(\d{2,3})\-?(\d{3,4})\-?(\d{4})$/)
  tel_number: string

  @IsString()
  @IsValidName({
    groups: ['name'],
    nameKeys: {
      fn_furi: 'firstname_kana',
      fn_kanji: 'firstname',
      ln_furi: 'lastname_kana',
      ln_kanji: 'lastname',
    },
  })
  @IsOptional()
  firstname: string

  @IsString()
  @IsValidName({
    groups: ['name'],
    nameKeys: {
      fn_furi: 'firstname_kana',
      fn_kanji: 'firstname',
      ln_furi: 'lastname_kana',
      ln_kanji: 'lastname',
    },
  })
  @IsOptional()
  lastname: string

  @IsString()
  @IsValidName({
    groups: ['name'],
    nameKeys: {
      fn_furi: 'firstname_kana',
      fn_kanji: 'firstname',
      ln_furi: 'lastname_kana',
      ln_kanji: 'lastname',
    },
  })
  @IsOptional()
  firstname_kana: string

  @IsString()
  @IsValidName({
    groups: ['name'],
    nameKeys: {
      fn_furi: 'firstname_kana',
      fn_kanji: 'firstname',
      ln_furi: 'lastname_kana',
      ln_kanji: 'lastname',
    },
  })
  @IsOptional()
  lastname_kana: string

  @IsString()
  @IsOptional()
  referral_code?: string

  @IsEnum(StorePaymentMethod, {
    always: true,
    message: `Invalid value (payment method must be one of following values: ${Object.values(
      StorePaymentMethod,
    ).join(', ')})`,
  })
  @IsOptional()
  payment_method?: StorePaymentMethod

  @IsString()
  @IsOptional()
  company_name: string

  @IsString()
  @IsOptional()
  company_name_kana: string

  @IsOptional()
  @IsString()
  registration_number?: string

  @IsString()
  @IsEmail()
  email: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  margin_rate?: number

  @IsNumber()
  @IsOptional()
  spec_rate?: number

  @IsOptional()
  spec_starts_at?: Date

  @IsOptional()
  spec_ends_at?: Date

  @IsBoolean()
  @IsOptional()
  is_return_guarantee?: boolean

  @IsOptional()
  @IsString()
  mobile_number?: string

  @IsOptional()
  @IsString()
  emerge_number?: string

  @IsOptional()
  @IsString()
  contact_firstname?: string

  @IsOptional()
  @IsString()
  contact_lastname?: string

  @IsOptional()
  @IsString()
  contact_firstname_kana?: string

  @IsOptional()
  @IsString()
  contact_lastname_kana?: string

  @IsOptional()
  @IsString()
  contact_tel?: string

  @IsOptional()
  @IsEnum(Gender, {
    always: true,
    message: `Invalid value (gender must be one of following values: [${Object.values(
      Gender,
    ).join(',')}])`,
  })
  gender?: Gender

  @IsOptional()
  @IsString()
  birthday?: string

  @IsOptional()
  @IsString()
  url: string

  @IsOptional()
  @IsString()
  company_official_name?: string

  @IsBoolean()
  @IsOptional()
  has_photo_service?: boolean
}

export default registerStoreCmsController
