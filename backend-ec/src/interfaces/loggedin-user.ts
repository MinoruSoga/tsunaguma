import { UserStatus, UserType } from '../modules/user/entity/user.entity'
export interface LoggedInUser {
  id: string
  store_id: string
  type: UserType
  status: UserStatus
}
