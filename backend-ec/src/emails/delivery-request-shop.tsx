import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Link } from '@react-email/link'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'

import { formatNumberJP } from '../helpers/number'
import { Footer } from './footer'

export default function DeliveryRequestShop(props) {
  const { delivery, year } = props

  if (delivery['parent_id']) {
    const { store, product } = delivery
    const { variants } = product
    const preview = `【つなぐマーケット】納品申請を受け付けました`
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
                  作品の納品申請を受け付けました。
                  <br />
                  内容をご確認いただき、発送のご対応をお願いいたします。
                  <br />
                  <br />
                  作品発送の際は、下記URL「納品申請の方法」より発送方法・注意点をご確認の上、発送をお願いいたします。
                  <br />
                  <Link
                    style={anchor}
                    href="https://faq.tsunagu-market.jp/--633527739b7b3e001ddf9de2"
                  >
                    「納品申請の方法」
                  </Link>
                  <br />
                  <br />
                </Text>
                <Text style={heading}>▽納品作品</Text>
                <Hr style={hr} />
                <Text style={callout}>
                  {variants.map((variant, index) => (
                    <>
                      作品タイトル ： {product.title || ''}
                      <br />
                      カラー ：{' '}
                      {variant.options?.find(
                        (option) => option.option_id === 'opt_color',
                      ).value || ''}
                      <br />
                      サイズ ：{' '}
                      {variant.options?.find(
                        (option) => option.option_id === 'opt_size',
                      ).value || ''}
                      <br />
                      金額 ： ￥{formatNumberJP(delivery.suggested_price || 0)}
                      <br />
                      個数 ：
                      {formatNumberJP(
                        variant.requests?.find(
                          (request) =>
                            request.delivery_request_id === delivery.id,
                        ).delivery_quantity || 0,
                      )}
                      <br />
                      {index !== variants.length - 1 && <br />}
                    </>
                  ))}
                </Text>
                <Hr style={hr} />
                <Text style={paragraph}>
                  ＜発送先＞
                  <br />
                  〒370-3522 <br />
                  群馬県高崎市菅谷町20-253 <br />
                  きもの365高崎配送センター
                  <br />
                  Tel:0800-100-1365 <br />
                  <br />
                  配送トラブルが起こる場合がございますので、追跡可能な方法にて発送をお願いいたします。
                  <br />
                  伝票番号等のお控えはお手元にて保管をお願いいたします。
                  <br />
                  <br />
                  納品作品のサイト公開まで、作品到着後より4週間程度（目安）お時間をいただいております。
                  <br />
                  どうぞよろしくお願いいたします。
                </Text>
              </Text>
            </Section>
            <Footer year={year} />
          </Container>
        </Section>
      </Html>
    )
  } else {
    const { store, children } = delivery
    const preview = `【つなぐマーケット】納品申請を受け付けました`
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
                  作品の納品申請を受け付けました。
                  <br />
                  内容をご確認いただき、発送のご対応をお願いいたします。
                  <br />
                  <br />
                  作品発送の際は、下記URL「納品申請の方法」より発送方法・注意点をご確認の上、発送をお願いいたします。
                  <br />
                  <Link
                    style={anchor}
                    href="https://faq.tsunagu-market.jp/--633527739b7b3e001ddf9de2"
                  >
                    「納品申請の方法」
                  </Link>
                  <br />
                  <br />
                </Text>
                <Text style={heading}>▽納品作品</Text>
                <Hr style={hr} />
                <Text style={callout}>
                  {children.map((chil, i) => {
                    const product = chil.product
                    const variants = product.variants
                    return (
                      <>
                        {variants.map((variant, index) => (
                          <>
                            作品タイトル ： {product.title || ''}
                            <br />
                            カラー ：{' '}
                            {variant.options?.find(
                              (option) => option.option_id === 'opt_color',
                            ).value || ''}
                            <br />
                            サイズ ：{' '}
                            {variant.options?.find(
                              (option) => option.option_id === 'opt_size',
                            ).value || ''}
                            <br />
                            金額 ： ￥
                            {formatNumberJP(chil.suggested_price || 0)}
                            <br />
                            個数 ：
                            {formatNumberJP(
                              variant.requests?.find(
                                (request) =>
                                  request.delivery_request_id === chil.id,
                              ).delivery_quantity || 0,
                            )}
                            <br />
                            {index !== variants.length - 1 && <br />}
                          </>
                        ))}
                        {i !== children.length - 1 && <br />}
                      </>
                    )
                  })}
                </Text>
                <Hr style={hr} />
                <Text style={paragraph}>
                  ＜発送先＞
                  <br />
                  〒370-3522 <br />
                  群馬県高崎市菅谷町20-253 <br />
                  きもの365高崎配送センター
                  <br />
                  Tel:0800-100-1365 <br />
                  <br />
                  配送トラブルが起こる場合がございますので、追跡可能な方法にて発送をお願いいたします。
                  <br />
                  伝票番号等のお控えはお手元にて保管をお願いいたします。
                  <br />
                  <br />
                  納品作品のサイト公開まで、作品到着後より4週間程度（目安）お時間をいただいております。
                  <br />
                  どうぞよろしくお願いいたします。
                </Text>
              </Text>
            </Section>
            <Footer year={year} />
          </Container>
        </Section>
      </Html>
    )
  }
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

const hrDot = {
  borderColor: '#e6ebf1',
  borderStyle: 'dashed',
  borderWidth: '1px',
}
