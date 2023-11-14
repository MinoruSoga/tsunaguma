/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EventBusService } from '@medusajs/medusa'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import loadConfig from '../../../../helpers/config'
import { UserStatus } from '../../entity/user.entity'
import UserService from '../../services/user.service'
import { StoreDetailService } from './../../../store/services/store-detail.service'

export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const eventBusService =
    req.container.resolve<EventBusService>('eventBusService')
  const userService = req.container.resolve<UserService>('userService')
  const storeDetailService = req.container.resolve<StoreDetailService>(
    StoreDetailService.resolutionKey,
  )
  const config = loadConfig()

  const apiKey = req.headers['x-api-key']
  if (!apiKey || apiKey !== config.meiliSearch.resetKey) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  const users = (await userService
    // @ts-ignore
    .list({ status: UserStatus.ACTIVE })) as User[]

  for (const user of users) {
    const storeDetail = await storeDetailService.retrieveByUser(user.id, false)

    if (!storeDetail && !user.address_id) continue

    if (!storeDetail) {
      await eventBusService.emit(UserService.Events.UPDATE_ADDRESS, {
        addressId: user.address_id,
        userId: user.id,
      })
    } else {
      await eventBusService.emit(StoreDetailService.Events.UPDATED, {
        id: storeDetail.id,
      })
    }
  }

  res.sendStatus(200)
}
