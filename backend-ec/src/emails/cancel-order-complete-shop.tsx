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
import { getOrderId, getStoreId } from '../helpers/display_id'
import { formatNumberJP } from '../helpers/number'
import { Footer } from './footer'

dayjs.locale('ja')

export default function CancelOrderCompleteShop(props) {
  const { order, year } = props
  const config = loadConfig()

  const preview = `【つなぐマーケット】ご購入者よりキャンセル同意のご連絡`
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
                会員ID: {getStoreId(order?.store?.display_id)}
                <br />
                <br />
                この度、{order?.customer?.nickname}様より
                <br />
                以下のご注文についてキャンセルの同意がございました。
                <br />
                ご注文はキャンセルとなります。
                <br />
                <br />
              </Text>
              <Hr style={hr} />
              <Text>
                {dayjs(order.created_at).format('YYYY/MM/DD HH:mm:ss')}の注文
                <br />
                受付ID：{getOrderId(order?.display_id, true)}
              </Text>
              <Hr style={hr} />
              <Hr style={hrHaft} />
              <Text>注文ID：{getOrderId(order?.display_id, true)}</Text>
              <Hr style={hrHaft} />
              {order?.items?.map((item) => (
                <>
                  <Hr style={hrHaft} />
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
                    小計 ：{formatNumberJP(item?.unit_price * item?.quantity)}円
                  </Text>
                </>
              ))}
              <br />
              <Text>
                ご不明な点がございましたら下記よりお問い合わせください。
              </Text>
              <Text style={heading}>▽「お問い合わせ」</Text>
              <Link style={anchor} href={config.frontendUrl.contact}>
                {config.frontendUrl.contact}
              </Link>
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
