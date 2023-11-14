import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Link } from '@react-email/link'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'
import * as React from 'react'
import nl2br from 'react-nl2br'

import loadConfig from '../helpers/config'
import { Footer } from './footer'

export default function OrderCompletionShop(props) {
  const { order, year } = props
  const config = loadConfig()

  const preview = `${order?.created_at} のご注文情報をご確認ください。`
  const formatter = new Intl.NumberFormat('ja-JP')

  const hasStock = order.items?.some((i: any) => i.variant.manage_inventory)
  const managedInventoryItems =
    order.items?.filter((i: any) => i.variant.manage_inventory) || []

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
              注文内容をご確認のうえ、作品の発送をお願いいたします。
              <br />
              ※作品の発送が遅れる場合は、必ず購入者様へメッセージでご連絡ください。
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
                    `価格 ： ${formatter.format(
                      order_items.total_unit_price,
                    )}円`,
                  )
                  order_details.push(`数量 ： ${order_items.quantity}`)
                  order_details.push(
                    `小計 ： ${formatter.format(order_items.subtotal)}円 `,
                  )
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
              注文内容の詳細は以下のページでご確認いただけます。
              <br />
              ▽「取引詳細」
              <br />
              <Link
                style={anchor}
                href={config.frontendUrl.transactionHistoryDetail(order.id)}
              >
                {config.frontendUrl.transactionHistoryDetail(order.id)}
              </Link>
              <br />
            </Text>

            {hasStock ? (
              <>
                <Text style={heading}>【在庫状況】</Text>
                <Text style={paragraph}>
                  注文受付後の在庫数をお知らせいたします。在庫数は編集ページより変更いただけます。
                  <br />
                </Text>
                <Text style={callout}>
                  {(() => {
                    const order_details: string[] = []
                    for (const order_items of managedInventoryItems) {
                      order_details.push(
                        `作品名 ： ${order_items.variant.product.title}`,
                      )
                      order_details.push(
                        `在庫数 ： ${order_items.variant.inventory_quantity}`,
                      )
                      order_details.push(
                        `編集ページ ： ${config.frontendUrl.editProduct(
                          order_items.variant.product_id,
                        )}`,
                      )
                    }
                    order_details.push(`\n`)
                    return nl2br(order_details.join('\n'))
                  })()}
                </Text>
              </>
            ) : null}

            <Text style={paragraph}>
              ※発送日超過により購入者様よりキャンセルのお申し出があった場合は
              <br />
              予告なくお取引をキャンセルする場合がございます。
              <br />
              必ず発送目安日以内に作品の発送をお願いいたします。
              <br />
            </Text>

            {/* <Text style={smaller}>
              作品が発送されると発送完了メールが届きます。
              <br />
              出店者より作品が発送されるまでお待ちくださいませ。
            </Text> */}
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

const center = {
  textAlign: 'center' as const,
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

const anchor = {
  color: '#F06B02',
}

const button = {
  backgroundColor: '#F06B02',
  borderRadius: '5px',
  color: '#fff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '230px',
  margin: '0 auto',
}

const button2 = {
  backgroundColor: '#9A8A7C',
  borderRadius: '5px',
  color: '#fff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '13px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '180px',
  margin: '0 auto',
}

const footer = {
  color: '#8898aa',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '12px',
  lineHeight: '16px',
}
