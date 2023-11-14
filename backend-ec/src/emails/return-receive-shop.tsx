import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'

import { Footer } from './footer'

export default function ReturnReceive(props) {
  const { year, returnRequest } = props
  const { order, items } = returnRequest
  const { store } = order
  const preview = `【つなぐマーケット】返却依頼の作品を発送しました`

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
                下記作品の発送が完了しました。
                <br />
                しばらくお待ちくださいませ。
                <br />
              </Text>
              <Text style={callout}>
                {items?.map((item) => {
                  const variant = item?.item?.variant
                  return (
                    <>
                      作品名 ： {variant?.product?.title}
                      <br />色 ： {variant?.title.split('/')[0]}
                      <br />
                      サイズ ： {variant?.title.split('/')[1]}
                      <br />
                      申請個数 ： {item.quantity}
                      <br />
                      <br />
                    </>
                  )
                })}
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
