import { TransactionBaseService } from '@medusajs/medusa'
import { FindConfig } from '@medusajs/medusa/dist/types/common'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { buildQuery } from '@medusajs/medusa/dist/utils'
import {
  DeleteCardArgs,
  DeleteCardResult,
  SaveCardArgs,
  SaveCardResult,
  SaveMemberArgs,
  SaveMemberResult,
  SearchCardArgs,
  SearchCardResult,
  SeqMode,
  SiteArgs,
} from 'gmopg'
import GMOPG from 'gmopg'
import { MedusaError } from 'medusa-core-utils'
import { Service } from 'medusa-extender'
import { EntityManager } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

import loadConfig from '../../../helpers/config'
import { SaveMemberParams } from '../controllers/gmo/create-gmo-member.admin.controller'
import { GmoMember } from '../entity/gmo-member.entity'
import { GmoMemberRepository } from '../repository/gmo-member.repository'

interface ConstructorParams {
  manager: EntityManager
  gmoMemberRepository: typeof GmoMemberRepository
  logger: Logger
}

const CARD_SEQ_DEFAULT = '0'

type Gmopg = {
  defaultCardData(): SiteArgs
  saveMember(args: SaveMemberArgs): Promise<SaveMemberResult>
  saveCard(args: SaveCardArgs): Promise<SaveCardResult>
  deleteCard(args: DeleteCardArgs): Promise<DeleteCardResult>
  searchCard(args: SearchCardArgs): Promise<SearchCardResult[]>
  post<T, U>(pathname: string, data: T): Promise<U>
}

@Service()
export class GmoService extends TransactionBaseService {
  static resolutionKey = 'gmoService'

  protected readonly manager_: EntityManager
  protected transactionManager_: EntityManager
  protected gmoMemberRepository: typeof GmoMemberRepository

  private logger: Logger
  private gmopg: Gmopg

  constructor(private readonly container: ConstructorParams) {
    super(container)
    const config = loadConfig()

    this.gmopg = new GMOPG({
      baseUrl: config.gmo.baseUrl,
      SiteID: config.gmo.siteID,
      SitePass: config.gmo.sitePass,
      ShopID: config.gmo.shopID,
      ShopPass: config.gmo.shopPass,
    })

    this.logger = container.logger
    this.manager_ = container.manager
    this.gmoMemberRepository = container.gmoMemberRepository
  }

  async retrieveMember(
    userId: string,
    config: FindConfig<GmoMember> = {},
  ): Promise<GmoMember> {
    const gmoRepo = this.manager_.getCustomRepository(this.gmoMemberRepository)
    const query = buildQuery({ user_id: userId }, config)
    const raw = await gmoRepo.findOne(query)

    if (!raw)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Not a gmo member already',
      )

    return raw
  }

  async saveGmoMember(userId: string, args: SaveMemberParams) {
    const gmoMemberRepo = this.manager_.getCustomRepository(
      this.gmoMemberRepository,
    )

    // const userId = this.container.loggedInUser.id
    let gmoMemberID: string
    const member = await gmoMemberRepo.findOne({
      user_id: userId,
    })

    if (member) {
      gmoMemberID = member.member_id
      await this.gmopg.saveCard({
        Token: args.token,
        MemberID: gmoMemberID,
      })
      const deleteCardArgs = {
        MemberID: member.member_id,
        CardSeq: CARD_SEQ_DEFAULT,
      }

      await this.gmopg.deleteCard(deleteCardArgs)
    } else {
      const saveMemberParams = {
        MemberID: uuidv4(),
        MemberName: args.member_name,
      }

      const gmoMember: SaveMemberResult = await this.gmopg.saveMember(
        saveMemberParams,
      )
      gmoMemberID = gmoMember.MemberID
      await this.gmopg.saveCard({
        Token: args.token,
        MemberID: gmoMemberID,
      })
    }

    const memberAtt = {
      user_id: userId,
      member_id: gmoMemberID,
    }

    if (member) {
      return await gmoMemberRepo.update({ id: member.id }, memberAtt)
    }

    const newMember = gmoMemberRepo.create(memberAtt)

    return await gmoMemberRepo.save(newMember)
  }

  async showCard(userId: string) {
    try {
      const gmoMemberRepo = this.manager_.getCustomRepository(
        this.gmoMemberRepository,
      )

      // const userId = this.container.loggedInUser.id
      const member = await gmoMemberRepo.findOne({
        user_id: userId,
      })

      if (!member) {
        return []
      }

      const config = loadConfig()

      return await this.gmopg.searchCard({
        ...{
          MemberID: member.member_id,
          SeqMode: SeqMode.Logic,
          SiteID: config.gmo.siteID,
          SitePass: config.gmo.sitePass,
        },
      })
    } catch (error) {
      return []
    }
  }
}
