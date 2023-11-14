import { faker } from '@faker-js/faker'
import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import StoreService from '../../modules/store/services/store.service'
import { UserStatus, UserType } from '../../modules/user/entity/user.entity'
import UserService from '../../modules/user/services/user.service'

export default async function seedUsers(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const userService = (
    container.resolve('userService') as UserService
  ).withTransaction(tx)
  const storeService = (
    container.resolve('storeService') as StoreService
  ).withTransaction(tx)

  const users = new Array(10).fill({}).map(() => ({
    id: undefined,
    email: faker.internet.email().toLowerCase(),
    nickname: faker.internet.userName(),
    type: faker.helpers.arrayElement(Object.values(UserType)),
    status: faker.helpers.arrayElement(Object.values(UserStatus)),
  }))
  const dbUsers = await Promise.all(
    users.map((user) => userService.create(user, 'password')),
  )
  users.forEach((user, idx) => {
    user.id = dbUsers[idx].id
  })
  const stores = users
    .filter(
      (user) =>
        (user.type === UserType.STORE_PRIME ||
          user.type === UserType.STORE_STANDARD) &&
        user.status === UserStatus.ACTIVE,
    )
    .map((user) => ({
      name: user.nickname,
      owner_id: user.id,
    }))
  await Promise.all(stores.map((store) => storeService.createStore(store)))
}
