import { MedusaContainer } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import CustomerService from '../../modules/user/services/customer.service'
import UserRepository from '../../modules/user/user.repository'

export default async function seedCustomers(
  container: MedusaContainer,
  tx: EntityManager,
) {
  const userRepository = tx.getCustomRepository(
    container.resolve('userRepository'),
  ) as UserRepository
  const customerService = (
    container.resolve('customerService') as CustomerService
  ).withTransaction(tx)

  const users = await userRepository.find()

  await Promise.all(
    users.map((user) => customerService.createUserCustomer(user)),
  )
}
