import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'

import { CampaignRequest } from '../modules/campaign-request/entities/campaign-request.entity'
import { Footer } from './footer'

interface Props {
  campaignRequest: CampaignRequest
  price: number
  year: number
}

export const CampaignRequestShop = (props: Props) => {
  const { campaignRequest, price, year } = props
  const { product, store } = campaignRequest

  const formatter = new Intl.NumberFormat('ja-JP')

  const preview = `【つなぐマーケット】1作品成約手数料無料キャンペーン申請を受け付けました`

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Section style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              style={logo}
              src="https://tsunagu-market.jp/images/site/market/logos/logo_main.png"
              width="150"
              height="31.95652159"
              alt="つなぐマーケット"
            />
            <Hr style={hr} />
            <Text style={paragraph}>
              <Text style={paragraph}>
                {store.name}様
                <br />
                <br />
                この度は、1作品成約手数料無料キャンペーンへの申請ありがとうございます。
                <br />
                下記の内容で申請を受け付けました。
                <br />
                <br />
              </Text>
              <Text style={heading}>▽1作品成約手数料無料キャンペーン</Text>
              <Text style={callout}>
                対象作品名：{product.title}
                <br />
                対象作品価格：{formatter.format(price)}円
                <br />
                キャンペーン手数料：無料
                <br />
                キャンペーン反映期間：2024年3月31日まで
              </Text>
              <br />
            </Text>
          </Section>
          <Footer year={year} />
        </Container>
      </Section>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const box = {
  padding: '0 48px',
}

const logo = {
  margin: '0 auto',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const paragraph = {
  color: '#525f7f',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '28px',
  textAlign: 'left' as const,
}

const callout = {
  ...paragraph,
  padding: '24px',
  backgroundColor: '#f2f3f3',
  borderRadius: '4px',
}

const heading = {
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
}
