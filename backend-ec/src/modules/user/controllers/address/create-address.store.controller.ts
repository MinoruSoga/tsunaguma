import { StorePostCustomersCustomerAddressesReq } from '@medusajs/medusa'
import { AddressCreatePayload } from '@medusajs/medusa/dist/types/common'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { NextFunction, Response } from 'express'
import { MedusaRequest, Validator } from 'medusa-extender'

import { JAPANESE_COUNTRY_ISO2 } from '../../../../helpers/constant'

export const prepareCreateAddressController = async (
  req: MedusaRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.body.address && !req.body?.address?.country_code) {
    req.body.address.country_code = JAPANESE_COUNTRY_ISO2
  }
  next()
}

@Validator({ override: AddressCreatePayload })
export class ExtendedAddressCreatePayload extends AddressCreatePayload {
  @IsString()
  @IsOptional()
  country_code: string

  @IsOptional()
  @IsBoolean()
  is_show?: boolean
}

@Validator({ override: StorePostCustomersCustomerAddressesReq })
export class ExtendedStorePostCustomersCustomerAddressesReq {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ExtendedAddressCreatePayload)
  address: ExtendedAddressCreatePayload

  @IsOptional()
  city?: string
}
