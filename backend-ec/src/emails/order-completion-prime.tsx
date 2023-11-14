import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Link } from '@react-email/link'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'
import nl2br from 'react-nl2br'

import loadConfig from '../helpers/config'
import { Footer } from './footer'

export default function OrderCompletionShop(props) {
  const { order, year } = props
  const config = loadConfig()

  const preview = `${order?.created_at} のご注文情報をご確認ください。`
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
            <Text style={paragraph}>
              {order?.store?.name}様 <br />
              <br />
              つなぐマーケットで販売中の作品が購入されました。
              <br />
              これより、つなぐマーケット運営が購入された作品の発送をいたします。
              <br />
              ※作品が購入された際、ご自身で行っていただくことはございません。
              <br />
            </Text>
            <Text style={heading}>【注文内容】</Text>
            <Text style={callout}>
              {order?.created_at} の注文 <br />
              注文ID：{order?.display_id}T <br />
              <br />
              {(() => {
                const order_details: string[] = []
                for (const order_items of order.items) {
                  order_details.push(
                    `作品名 ： ${order_items.variant?.product.title}`,
                  )
                  order_details.push(`URL ： ${order_items.url}`)
                  order_details.push(
                    `価格 ： ${formatter.format(order_items.subtotal)}円 `,
                  )
                  order_details.push(`数量 ： ${order_items.quantity}`)

                  order_details.push(
                    `配送方法 ： ${
                      order_items.shipping_method?.shipping_option?.provider
                        ?.is_free
                        ? order_items.shipping_method?.shipping_option
                            .provider_name
                        : order_items.shipping_method?.shipping_option?.provider
                            ?.name
                    } `,
                  )
                  order_details.push(`\n`)
                }
                order_details.push(`購入者 ： ${order.customer?.nickname}`)
                order_details.push(`購入日時 ：${order.created_at}`)
                order_details.push(`取引状況 ： ${'新規注文'}`)
                // order_details.push(`発送予定日 ： ${''}`)
                order_details.push(
                  `送料 ： ${formatter.format(order.shipping_total)}円 `,
                )
                order_details.push(
                  `合計金額 ： ${formatter.format(order.total)}円 `,
                )
                order_details.push(`\n`)
                return nl2br(order_details.join('\n'))
              })()}
            </Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              作品の発送状況や注文内容の詳細は、以下のページでご確認いただけます。
              <br />
              <br />
              ▽「取引履歴履歴」
              <br />
              <Link
                style={anchor}
                href={config.frontendUrl.transactionHistoryDetail(order.id)}
              >
                {config.frontendUrl.transactionHistoryDetail(order.id)}
              </Link>
              <br />
              <br />
              ▽お取引に関するよくある質問はこちら
              <br />
              <Link style={anchor} href="https://faq.tsunagu-market.jp/?q=%E5%8F%96%E5%BC%95">
                https://faq.tsunagu-market.jp/?q=%E5%8F%96%E5%BC%95
              </Link>
            </Text>
            <Hr style={hr} />
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
