import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'
import nl2br from 'react-nl2br'

import { Footer } from './footer'

export default function WithdrawalCustomerComplete(props: {
  nickname: string
  id: string
  year: any
  reasons: string[]
  note: string
  isStore: boolean
  store_id: string
}) {
  const { nickname, year, id, reasons, note, isStore, store_id } = props

  const preview = `【つなぐマーケット】退会が完了しました  `

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
              {nickname}様 <br />
              会員ID: {isStore ? `${store_id}S` : `${id}C`}
              <br /> <br />
              つなぐマーケットの退会処理が行われました。 <br />
              またのご利用をお待ちしております。 <br /> <br />
              {reasons?.length ? (
                <>
                  【退会理由】 <br />
                </>
              ) : null}
              {(() => {
                const reasonList: string[] = []
                for (const reason of reasons) {
                  if (reason) {
                    reasonList.push(`・ ${reason}`)
                  }
                }
                return nl2br(reasonList.join('\n'))
              })()}
              <br />
              <br />
              【その他理由】
              <br />
              {note}
              <br />
              <br />
              ※退会後もつなぐマーケットからのメールが一定期間届く場合がございます
              <br />
              　予めご了承ください。
            </Text>
            <br />
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
