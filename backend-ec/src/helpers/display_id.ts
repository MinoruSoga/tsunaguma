import { UserType } from '../modules/user/entity/user.entity'

export const UserTypeDisplay = {
  [UserType.CUSTOMER]: '一般購入者',
  [UserType.STORE_STANDARD]: 'スタンダード店舗',
  [UserType.STORE_PRIME]: 'プライム店舗',
  [UserType.ADMIN_ADMIN]: '管理者',
  [UserType.ADMIN_STAFF]: '管理スタッフ',
}

function getDisplayId(id: number, suffix: string) {
  if (!id) {
    return ''
  }
  return `${id}${suffix}`
}

export function getCustomerId(id?: number) {
  return getDisplayId(id, 'C')
}

export function getStoreId(id?: number) {
  return getDisplayId(id, 'S')
}

export function getProdId(id?: number) {
  return getDisplayId(id, 'P')
}

export function getOrderId(id?: number, isStore?: boolean) {
  return getDisplayId(id, isStore ? 'T' : 'O')
}
