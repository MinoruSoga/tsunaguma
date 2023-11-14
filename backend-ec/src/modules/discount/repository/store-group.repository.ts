import { Repository as MedusaRepository } from 'medusa-extender'
import { DeleteResult, EntityRepository, In, Repository } from 'typeorm'

import { StoreGroup } from '../entities/store-group.entity'

@MedusaRepository()
@EntityRepository(StoreGroup)
export class StoreGroupRepository extends Repository<StoreGroup> {
  async addStores(groupId: string, storeIds: string[]): Promise<StoreGroup> {
    const storeGroup = await this.findOne(groupId)
    await this.createQueryBuilder()
      .insert()
      .into('store_group_stores', ['store_id', 'store_group_id'])
      .values(
        storeIds.map((e) => ({
          store_id: e,
          store_group_id: groupId,
        })),
      )
      .orIgnore()
      .execute()
    return storeGroup as StoreGroup
  }

  async removeStores(
    groupId: string,
    storeIds: string[],
  ): Promise<DeleteResult> {
    return await this.createQueryBuilder()
      .delete()
      .from('store_group_stores')
      .where({
        store_group_id: groupId,
        store_id: In(storeIds),
      })
      .execute()
  }
}
