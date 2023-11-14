import 'dayjs/locale/ja'

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
import { getOrderId } from '../helpers/display_id'
import { formatNumberJP } from '../helpers/number'
import { ProductReviews } from '../modules/product/entity/product-reviews.entity'
import { Footer } from './footer'

dayjs.locale('ja')

export default function ReviewCompleteShop(props) {
  const { order, reviews, year } = props
  const config = loadConfig()
  const price: { shipping_total?: number; subtotal?: number; total?: number } =
    order?.metadata?.price

  const starRate = {
    1: '★',
    2: '★★',
    3: '★★★',
    4: '★★★★',
    5: '★★★★★',
  }

  enum OrderStatusEnumKana {
    NEW_ORDER = '新規注文',
    PREPARING_TO_SHIP = '発送準備中',
    SHIPPING_COMPLETED = '発送完了',
    TRANSACTION_COMPLETED = '取引完了済',
    CANCEL = 'キャンセル',
    RETURNS = '返品',
  }

  const getOrderStatus = (
    status: string,
    paymentStatus: string | undefined,
    fulfillmentStatus: string | undefined,
  ) => {
    let statusEn = ''
    if (
      status === 'pending' &&
      (paymentStatus === 'not_paid' ||
        paymentStatus === 'awaiting' ||
        paymentStatus === 'captured') &&
      fulfillmentStatus === 'not_fulfilled'
    )
      statusEn = 'NEW_ORDER'
    if (status === 'pending' && fulfillmentStatus === 'fulfilled')
      statusEn = 'PREPARING_TO_SHIP'
    if (status === 'pending' && fulfillmentStatus === 'shipped')
      statusEn = 'SHIPPING_COMPLETED'
    if (status === 'completed') statusEn = 'TRANSACTION_COMPLETED'
    if (status === 'canceled') statusEn = 'CANCEL'

    return OrderStatusEnumKana[statusEn]
  }

  const preview = `【つなぐマーケット】${order?.customer?.nickname}様からレビューが届いています`
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
                {order?.store?.name}さん
                <br />
                <br />
                {order.customer.nickname}からレビューが届きました。
                <br />
                レビューへの返信をお願いいたします。
                <br />
                <br />
              </Text>
              <Text style={heading}>■取引評価</Text>
              <Link
                style={anchor}
                href={config.frontendUrl.shopDetailReview(order?.store_id)}
              >
                {config.frontendUrl.shopDetailReview(order?.store_id)}
              </Link>
              <br />
              {reviews.map((review: ProductReviews) => (
                <>
                  <Hr style={hr} />
                  <Text style={callout}>
                    作品タイトル：{review?.variant?.product?.title}
                    <br />
                    評価 ： {starRate[review?.rate]} <br />
                    コメント ： <br />
                    {review?.content}
                  </Text>
                </>
              ))}

              <Hr style={hr} />
              <Text>
                {dayjs(order.created_at).format('YYYY/MM/DD HH:mm:ss')}の注文
                <br />
                受付ID：{getOrderId(order?.display_id, true)}
              </Text>
              <Hr style={hr} />
              <Text style={heading}>【購入作品】</Text>
              <Hr style={hrHaft} />
              <Text>注文ID：{getOrderId(order?.display_id, true)}</Text>
              {order?.items?.map((item) => (
                <>
                  <Text style={callout}>
                    作品名 ： {item?.variant?.product?.title}
                    <br />
                    URL ：
                    <Link
                      style={anchor}
                      href={config.frontendUrl.productDetail(
                        item?.variant?.product?.id,
                      )}
                    >
                      {config.frontendUrl.productDetail(
                        item?.variant?.product?.id,
                      )}
                    </Link>
                    <br />
                    価格 ： {formatNumberJP(item?.unit_price)}円
                    <br />
                    数量 ： {item?.quantity}個
                    <br />
                    配送方法 ：
                    {item?.shipping_method?.shipping_option?.name || ''}
                    <br />
                  </Text>
                </>
              ))}

              <Hr style={hrHaft} />
              <Text style={callout}>
                購入者 ： {order?.customer?.nickname}
                <br />
                購入日時 ：{' '}
                {dayjs(order?.created_at).format('YYYY /MM/DD/HH:mm')}
                <br />
                取引状況 ：{' '}
                {getOrderStatus(
                  order?.status,
                  order?.payment_status,
                  order?.fulfillment_status,
                )}
                <br />
                発送予定日 ：
                <br />
                送料 ：{' '}
                {formatNumberJP(
                  price ? price?.shipping_total : order?.shipping_total,
                )}
                円
                <br />
                ギフトラッピング ：
                <br />
                合計 ：{formatNumberJP(price ? price?.total : order?.total)}円
              </Text>
              <Hr style={hrHaft} />
            </Text>
          </Section>
          <Footer year={year} />
        </Container>
      </Section>
    </Html>
  )
}

const anchor = {
  color: '#F06B02',
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

const hrHaft = {
  width: '50%',
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
