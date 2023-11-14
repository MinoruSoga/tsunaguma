import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Link } from '@react-email/link'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'
import dayjs from 'dayjs'

import loadConfig from '../helpers/config'
import { UserPointHistory } from '../modules/point/entities/user-point-history.entity'
import { Footer } from './footer'

export default function PointExpireCustomer(props) {
  const { pointHistories, total, year } = props
  const config = loadConfig()

  const preview = `【つなぐマーケット】ポイント有効期限のお知らせ`
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
                            【重要】
                <br />
                つなぐマーケットポイント有効期限のお知らせ
                <br />
                こちらのメールは、サービスに関わる【重要なお知らせ】としてご案内しております。
                <br />
                メールマガジンをご希望されていない会員さまにも配信させていただいておりますのでご了承ください。
                <br />
              </Text>
              <Hr style={hr} />
              <br />
              <Text style={paragraph}>
                {pointHistories[0].user.nickname}様
                <br />
                <br />
                いつもつなぐマーケットをご利用いただき、誠にありがとうございます。
                <br />
                <br />
                有効期限が近付いているポイントがあります。
                <br />
                有効期限を過ぎますとポイントは失効となりますので、お忘れのないようぜひご利用ください。
                <br />
                <br />
              </Text>
              <Hr style={hr} />
              <Text style={heading}>保有ポイント　{total}</Text>
              <br />
              <Text style={callout}>
                {pointHistories.map((e: UserPointHistory) => (
                  <>
                    うち{dayjs(e.expired_at as Date).format('YYYY年MM月DD日')}
                    まで有効 : {e.left_amount}ポイント
                    <br />
                    <br />
                  </>
                ))}
              </Text>
              <Hr style={hr} />
              <Text style={paragraph}>
                ※{dayjs().format('YYYY年MM月DD日')}時点でのポイント数です。
                <br />
                ポイント利用のタイミングなどにより実際のポイント数と異なる場合がございます。
                <br />
                ▽「所持ポイント」
                <br />
                <Link style={anchor} href={config.frontendUrl.pointList}>
                  {config.frontendUrl.pointList}
                </Link>
              </Text>
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

const heading = {
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
}

const logo = {
  margin: '0 auto',
}

const box = {
  padding: '0 48px',
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

const anchor = {
  color: '#F06B02',
}
