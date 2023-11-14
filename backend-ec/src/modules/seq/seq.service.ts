import { TransactionBaseService } from '@medusajs/medusa'
import { Redis } from 'ioredis'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'

import { SeqMasterRepository } from './seq.repository'

type InjectedDependencies = {
  manager: EntityManager
  seqMasterRepository: typeof SeqMasterRepository
  redisClient: Redis
}

@Service()
export class SeqService extends TransactionBaseService {
  static resolutionKey = 'seqService'
  protected manager_: EntityManager
  protected transactionManager_: EntityManager | undefined
  protected seqMasterRepository_: typeof SeqMasterRepository
  protected redis_: Redis

  constructor(private readonly container: InjectedDependencies) {
    super(container)
    this.manager_ = container.manager
    this.seqMasterRepository_ = container.seqMasterRepository
    this.redis_ = container.redisClient
  }

  public async getProductSeqByCategoryId(
    categoryId: string,
    incr = 1,
  ): Promise<number> {
    const key = `${categoryId}_prod_seq`
    return await this.getNextSeq(key, incr)
  }

  public async getOrderSeqByStoreId(
    storeId: string,
    incr = 1,
  ): Promise<number> {
    const key = `${storeId}_order_seq`
    return await this.getNextSeq(key, incr)
  }

  public async getStoreNewTransactionCnt(storeId: string, incr = 1) {
    const key = `store_new_transaction_cnt_${storeId}`
    return await this.getNextSeq(key, incr)
  }

  private async getNextSeq(key: string, incr = 1): Promise<number> {
    const seqRepo = this.manager_.getCustomRepository(this.seqMasterRepository_)
    if (!(await this.redis_.exists(key))) {
      const seq = await seqRepo.findOne(key)
      if (seq) {
        await this.redis_.setnx(key, seq.seq)
      }
    }
    const cnt = await this.redis_.incrby(key, incr)
    await seqRepo.save(
      seqRepo.create({
        id: key,
        seq: cnt,
      }),
    )
    return cnt
  }

  public async resetSeq(key: string, cnt = 0): Promise<void> {
    const seqRepo = this.manager_.getCustomRepository(this.seqMasterRepository_)
    await this.redis_.set(key, cnt)
    await seqRepo.save({ id: key, seq: cnt })
  }
}
