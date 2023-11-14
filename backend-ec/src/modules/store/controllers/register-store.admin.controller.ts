import { EventBusService } from '@medusajs/medusa/dist/services'
import { validator } from '@medusajs/medusa/dist/utils/validator'
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
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
import { FulfillmentProvider } from '../../shipping/entities/fulfillment-provider.entity'
import { FulfillmentProviderService } from '../../shipping/services/fulfillment-provider.service'
import { ShippingProfileService } from '../../shipping/services/shipping-profile.service'
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
 * @oas [post] /mystore/register
 * operationId: "RegisterStore"
 * summary: "Register a store"
 * description: "Creates a store which can be associated with an logged in user."
 * x-authenticated: true
 * requestBody:
 *  content:
 *    application/json:
 *      schema:
 *        oneOf:
 *          - $ref: "#/components/schemas/StoreRegisterIndividual"
 *          - $ref: "#/components/schemas/StoreRegisterCorporation"
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
const registerStoreController = async (
  req: MedusaAuthenticatedRequest,
  res: Response,
) => {
  const loggedInUser = req.scope.resolve(LOGGED_IN_USER_KEY) as LoggedInUser

  if (!loggedInUser || !loggedInUser.id) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not login')
  }

  const { business_form } = req.body
  const manager = req.scope.resolve('manager') as EntityManager
  const storeService = req.scope.resolve('storeService') as StoreService
  const eventBusService = req.scope.resolve(
    'eventBusService',
  ) as EventBusService

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

  // check if this user already owns a store or not
  const store = await storeService.retrieveStoreWithOwner(loggedInUser.id)
  if (store) {
    // if that user already has a store => if pending, just remove, if approved => reject
    if (store.status === StoreStatus.APPROVED) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        'This user already has a store',
      )
    } else if (store.status === StoreStatus.PENDING) {
      await storeService.deleteStore(store.id)
    }
  }

  if (!business_form)
    throw new MedusaError(
      MedusaError.Types.INVALID_ARGUMENT,
      'business_form is required',
    )
  if (!Object.values(StoreBusinessForm).includes(business_form))
    throw new MedusaError(
      MedusaError.Types.INVALID_ARGUMENT,
      `Invalid value (business_form must be one of following values: [${Object.values(
        StoreBusinessForm,
      ).join(',')}])`,
    )
  let validated: DeepPartial<Store> = {}

  if (business_form === StoreBusinessForm.INDIVIDUAL)
    validated = await validator(StoreRegisterIndividual, req.body)
  else validated = await validator(StoreRegisterCorporation, req.body)

  const { name, plan_type, ...rest } = validated

  await manager.transaction(async (transactionManager) => {
    // find if that user already have store detail or not
    const existing = await storeDetailService.retrieveByUser(
      loggedInUser.id,
      false,
    )

    const toCreate = existing
      ? Object.assign(existing, rest)
      : { ...rest, user_id: loggedInUser.id }

    const storeDetail = await storeDetailService
      .withTransaction(transactionManager)
      .create(toCreate)

    const storeData: DeepPartial<Store> = {
      store_detail_id: storeDetail.id,
      plan_type,
      business_form,
      name,
      owner_id: loggedInUser.id,
    }

    if (plan_type === StorePlanType.PRIME) {
      storeData.margin_rate = MARGIN_RATE_PRM
      storeData.photo_service_type = StorePhotoServiceEnum.BASIC
      storeData.is_return_guarantee = true
      storeData.has_photo_service = true
    } else {
      storeData.margin_rate = MARGIN_RATE_STD
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

    //auto approve
    await storeService
      .withTransaction(transactionManager)
      .approveStoreReg(store.id)

    await eventBusService
      .withTransaction(transactionManager)
      .emit(StoreDetailService.Events.UPDATED, { id: storeDetail.id })
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
 * @schema StoreRegisterCommon
 * title: "Register Store Common Params"
 * description: "Register Store Common Params"
 * x-resourceId: StoreRegisterCommon
 * required:
 *  - plan_type
 *  - business_form
 *  - gender
 *  - post_code
 *  - addr_01
 *  - addr_02
 *  - prefecture_id
 *  - tel_number
 *  - birthday
 *  - firstname
 *  - lastname
 *  - firstname_kana
 *  - lastname_kana
 * properties:
 *   name:
 *     type: string
 *     description: "The shop name"
 *   plan_type:
 *     $ref: "#/components/schemas/StorePlanTypeEnum"
 *   business_form:
 *     $ref: "#/components/schemas/StoreBusinessFormEnum"
 *   gender:
 *     $ref: "#/components/schemas/GenderEnum"
 *   post_code:
 *     type: string
 *   addr_01:
 *     type: string
 *     maxLength: 32
 *     description: "Street name of the store"
 *   addr_02:
 *     type: string
 *     maxLength: 32
 *     description: "Building name of the store"
 *   prefecture_id:
 *     type: string
 *     description: "Prefecture id of the store"
 *   tel_number:
 *     type: string
 *     description: "Phone number of the seller"
 *   birthday:
 *     type: string
 *     format: date
 *     description: "Date of birth of the seller"
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
 */
export class StoreRegisterCommon {
  @IsString()
  @IsOptional()
  name: string

  @IsEnum(StorePlanType, {
    always: true,
    message: `Invalid value (plan_type must be one of following values: [${Object.values(
      StorePlanType,
    ).join(',')}])`,
  })
  plan_type: StorePlanType

  @IsEnum(StoreBusinessForm, {
    always: true,
    message: `Invalid value (business_form must be one of following values: [${Object.values(
      StoreBusinessForm,
    ).join(',')}])`,
  })
  business_form: StoreBusinessForm

  @IsEnum(Gender, {
    always: true,
    message: `Invalid value (gender must be one of following values: [${Object.values(
      Gender,
    ).join(',')}])`,
  })
  gender: string

  @IsString()
  post_code: string

  @IsString()
  @MaxLength(32, { message: 'Street name can not be more than 32 characters' })
  addr_01: string

  @IsString()
  @MaxLength(32, {
    message: 'Building name can not be more than 32 characters',
  })
  addr_02: string

  @IsString()
  prefecture_id: string

  @IsString()
  @IsPhoneNumber('JP')
  tel_number: string

  @IsOnlyDate({ message: 'Date of birth is not valid (Format [YYYY-MM-DD])' })
  // @IsDateString({ message: 'Date of birth is not a valid date, ' })
  birthday: string

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
  lastname_kana: string

  @IsOptional()
  @IsString()
  referral_code?: string

  @IsOptional()
  @IsEnum(StorePaymentMethod, {
    always: true,
    message: `Invalid value (payment method must be one of following values: ${Object.values(
      StorePaymentMethod,
    ).join(', ')})`,
  })
  payment_method?: StorePaymentMethod
}

/**
 * @schema StoreRegisterIndividual
 * title: "Register Store Individual Params"
 * description: "Register Store Individual Params"
 * x-resourceId: StoreRegisterIndividual
 * allOf:
 *  - $ref: "#/components/schemas/StoreRegisterCommon"
 *  - type: object
 *    properties:
 *       mobile_number:
 *         type: string
 *         description: "Mobile number of the seller"
 *       emerge_number:
 *         type: string
 *         description: "Emergency phone number number of the seller"
 */
export class StoreRegisterIndividual extends StoreRegisterCommon {
  @IsOptional()
  mobile_number: string

  @IsOptional()
  emerge_number: string
}

/**
 * @schema StoreRegisterCorporation
 * title: "Register Store Corporation Params"
 * description: "Register Store Corporation Params"
 * x-resourceId: StoreRegisterCorporation
 * allOf:
 *  - $ref: "#/components/schemas/StoreRegisterCommon"
 *  - type: object
 *    required:
 *      - company_name
 *      - company_name_kana
 *      - compliance_1
 *      - compliance_2
 *    properties:
 *       company_name:
 *         type: string
 *         description: "Kanji corporation name of the rep"
 *       company_name_kana:
 *         type: string
 *         description: "Furigana corporation name of the rep"
 *       contact_firstname:
 *         type: string
 *         minLength: 32
 *         description: "Curator kanji first name"
 *       contact_lastname:
 *         type: string
 *         description: "Curator kanji first name"
 *       contact_firstname_kana:
 *         type: string
 *         description: "Curator furigana first name"
 *       contact_lastname_kana:
 *         type: string
 *         description: "Curator furigana last name"
 *       url:
 *         type: string
 *         description: "Website URL"
 *       contact_tel:
 *         type: string
 *         description: "Curator's phone number"
 *       compliance_1:
 *         type: boolean
 *         description: "Compliance 1"
 *       compliance_2:
 *         type: boolean
 *         description: "Compliance 2"
 *       company_official_name:
 *         type: string
 *       registration_number:
 *         type: string
 */

export class StoreRegisterCorporation extends StoreRegisterCommon {
  @IsString()
  company_name: string

  @IsString()
  company_name_kana: string

  @IsOptional()
  @IsString()
  url?: string

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

  @IsBoolean()
  compliance_1: boolean

  @IsBoolean()
  compliance_2: boolean

  @IsOptional()
  @IsString()
  company_official_name?: string

  @IsOptional()
  @IsString()
  registration_number?: string
}

export default registerStoreController
