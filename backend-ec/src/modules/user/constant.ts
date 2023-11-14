import { UserStatus, UserType } from './entity/user.entity'

interface TypeParams {
  type?: UserType
  status?: UserStatus
}

export const isAdmin = (user: TypeParams) => {
  return (
    user.type === UserType.ADMIN_ADMIN || user.type === UserType.ADMIN_STAFF
  )
}

export const isStoreStandard = (user: TypeParams) => {
  return user.type === UserType.STORE_STANDARD
}

export const isStorePrime = (user: TypeParams) => {
  return user.type === UserType.STORE_PRIME
}

export const isCustomer = (user: TypeParams) => {
  return user.type === UserType.STORE_PRIME
}

export const isActive = (user: TypeParams) => {
  return user.status === UserStatus.ACTIVE
}
