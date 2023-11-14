/* eslint-disable @typescript-eslint/ban-ts-comment */
import { StagedJobRepository } from '@medusajs/medusa/dist/repositories/staged-job'
import { EventBusService as MedusaEventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import Redis from 'ioredis'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

type InjectedDependencies = {
  manager: EntityManager
  logger: Logger
  stagedJobRepository: typeof StagedJobRepository
  redisClient: Redis.Redis
  redisSubscriber: Redis.Redis
}

@Service({ override: MedusaEventBusService })
export class EventBusService extends MedusaEventBusService {
  static resolutionKey = 'eventBusService'

  constructor(container: InjectedDependencies, private readonly config: any) {
    super(container, config)
  }
}
