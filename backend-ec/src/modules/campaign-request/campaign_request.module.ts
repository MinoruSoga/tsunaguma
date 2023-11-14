import { Module } from 'medusa-extender'

import { CampaignRouter } from './campaign_request.router'
import { CampaignRequest } from './entities/campaign-request.entity'
import { CampaignRequestMigration1692893507031 } from './migrations/1692893507031-campaign-request.migration'
import { CampaignRequestMigration1693189390155 } from './migrations/1693189390155-campaign-request.migration'
import { CampaignRequestRepository } from './repository/campaign-request.repository'
import { CampaignRequestService } from './service/campaign-request.service'

@Module({
  imports: [
    CampaignRouter,
    CampaignRequest,
    CampaignRequestMigration1692893507031,
    CampaignRequestService,
    CampaignRequestRepository,
    CampaignRequestMigration1693189390155,
  ],
})
export class CampaignModule {}
