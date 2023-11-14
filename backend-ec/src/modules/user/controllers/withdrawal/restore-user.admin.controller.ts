import { validator } from '@medusajs/medusa/dist/utils/validator'
import { IsString } from 'class-validator'
import { Response } from 'express'
import { MedusaError } from 'medusa-core-utils'
import { MedusaAuthenticatedRequest } from 'medusa-extender'

import loadConfig from '../../../../helpers/config'
import WithdrawalService from '../../services/withdrawal.service'

// backdoor api to restore user after withdrawal
export default async function (req: MedusaAuthenticatedRequest, res: Response) {
  const withdrawalService = req.container.resolve<WithdrawalService>(
    WithdrawalService.resolutionKey,
  )
  const data = await validator(RestoreUserReq, req.body)
  const config = loadConfig()

  const apiKey = req.headers['x-api-key']
  if (!apiKey || apiKey !== config.meiliSearch.resetKey) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, 'Not allowed')
  }

  await withdrawalService.restore(data.user_id)

  res.sendStatus(200)
}

class RestoreUserReq {
  @IsString()
  user_id: string
}
