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

export default function ReturnPurchaseRequest(props) {
  const { order, reason, year } = props

  const preview = `返品申請を受け付けました`
  const formatter = new Intl.NumberFormat('ja-JP')

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
            <Text style={heading}>■返品受付内容</Text>
            <Text style={paragraph}>
              {order?.created_at} の注文 <br />
              注文ID：{order?.display_id + 'T'} <br />
            </Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              {order?.customer?.nickname}様 <br />
            </Text>
            <br />
            <Text style={paragraph}>
              {(() => {
                const order_details: string[] = []
                order.items.forEach((item, index) => {
                  order_details.push(`作品名 ： ${item.variant.product.title}`)
                  order_details.push(`URL ： ${item.url}`)

                  if (index !== order.items.length - 1) {
                    order_details.push(
                      `------------------------------------------------------\n`,
                    )
                  } else {
                    order_details.push(`\n`)
                  }
                })
                return nl2br(order_details.join('\n'))
              })()}
            </Text>

            <Text style={heading}>【返品理由】</Text>
            <Text style={paragraph}>
              {reason}
              <br />
              <br />
            </Text>
            <Text style={heading}>【返却先】</Text>
            <Text style={paragraph}>
              〒370-3577　群馬県高崎市菅谷町20-235
              <br />
              TEL：027-310-4810
              <br />
              配送トラブルが起こる場合がございますので、追跡可能な方法にて発送をお願いいたします。
              <br />
              返品手続き完了までは伝票番号等のお控えはお手元にて保管をお願いいたします。
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

const heading = {
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const smaller = {
  color: '#525f7f',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '13px',
  lineHeight: '18px',
  textAlign: 'left' as const,
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
