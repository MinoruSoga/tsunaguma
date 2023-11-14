import { StorePostCustomersCustomerAddressesAddressReq } from '@medusajs/medusa'
import { AddressPayload } from '@medusajs/medusa/dist/types/common'
import { Type } from 'class-transformer'
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { NextFunction, Response } from 'express'
import { MedusaRequest, Validator } from 'medusa-extender'

export const prepareUpdateAddressController = async (
  req: MedusaRequest,
  res: Response,
  next: NextFunction,
) => {
  next()
}

@Validator({ override: AddressPayload })
export class ExtendedAddressPayload extends AddressPayload {
  @IsString()
  @IsOptional()
  prefecture_id?: string
}

@Validator({ override: StorePostCustomersCustomerAddressesAddressReq })
export class ExtendedStorePostCustomersCustomerAddressesAddressReq {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ExtendedAddressPayload)
  address: ExtendedAddressPayload
}
