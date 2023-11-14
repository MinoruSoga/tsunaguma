import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Link } from '@react-email/link'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'

import loadConfig from '../helpers/config'
import {
  DeliveryRequest,
  DeliveryRequestAdminStatus,
} from '../modules/delivery-request/entities/delivery-request.entity'
import { ProductVariant } from '../modules/product/entity/product-variant.entity'
import { Footer } from './footer'

interface Props {
  deliveryRequest: DeliveryRequest
  year: number
}

export const DeliveryRequestConfirmQuantity = (props: Props) => {
  const config = loadConfig()
  const { deliveryRequest, year } = props
  const { children, store } = deliveryRequest
  const requests = children.filter(
    (request) =>
      request.admin_status === DeliveryRequestAdminStatus.QUANTITY_CONFIRM,
  )

  // get variant info
  const getVariantInfo = (variant: ProductVariant) => {
    const { options, requests } = variant

    // color
    const color = options.find(
      (option) => option.option_id === 'opt_color',
    ).value

    //size
    const size = options.find((option) => option.option_id === 'opt_size').value

    const requestFind = requests.find(
      (request) => request.variant_id === variant.id,
    )
    const { delivery_quantity, different_quantity } = requestFind

    return { color, size, delivery_quantity, different_quantity }
  }

  const preview = `【つなぐマーケット】納品数のご確認をお願いいたします`

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
              <Hr style={hrDot} />
              <Text style={paragraph}>
                このメールはつなぐマーケットから配信されています
              </Text>
              <Hr style={hrDot} />
              <br />
              <Text style={paragraph}>
                {store.name}さん
                <br />
                <br />
                下記作品の納品申請と納品数に差異がございました。
                <br />
              </Text>
              <Text style={callout}>
                {requests.map((request) => {
                  const { product } = request
                  const { title, variants } = product
                  return (
                    <>
                      作品名 ： {title}
                      <br />
                      <br />
                      {variants.map((variant) => {
                        const {
                          color,
                          delivery_quantity,
                          different_quantity,
                          size,
                        } = getVariantInfo(variant)
                        return (
                          <>
                            色 ： {color}
                            <br />
                            サイズ ： {size}
                            <br />
                            申請個数 ： {delivery_quantity}
                            <br />
                            実際の納品数 ： {different_quantity}
                            <br />
                            <br />
                          </>
                        )
                      })}
                    </>
                  )
                })}
              </Text>
              <Text>
                上記の差異に対する対応を、以下のＵＲＬからお願いいたします。
                <br />
                <Link style={anchor} href={'#'}>
                  https://www.tsunagu-market.jp/************
                </Link>
              </Text>
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

const hrDot = {
  borderColor: '#e6ebf1',
  borderStyle: 'dashed',
  borderWidth: '1px',
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

const anchor = {
  color: '#F06B02',
}
