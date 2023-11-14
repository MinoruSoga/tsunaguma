import { Button } from '@react-email/button'
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

import { Footer } from './footer'

export default function ShopMessageReception(props) {
  const { buyerName, ownerName, messageContent, chattingThreadLink, year } =
    props

  const preview = `${buyerName}さんからメッセージが届きました。`

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
              {ownerName}様 <br />
              <br />
              {buyerName}さんからメッセージが届きました。
            </Text>
            <Text style={heading}>■ メッセージ内容</Text>
            <Text style={callout}>{nl2br(messageContent)}</Text>
            <Section style={center}>
              <Button href={chattingThreadLink} pX={10} pY={10} style={button}>
                メッセージに返信する
              </Button>
            </Section>
            <Hr style={hr} />
            <Section style={center}>
              <Button
                href="https://faq.tsunagu-market.jp/?q=%E5%8F%96%E5%BC%95"
                pX={10}
                pY={10}
                style={button2}
              >
                お取引に関するよくある質問
              </Button>
            </Section>
            <Text style={smaller}>
              ボタンクリックでページが開かない方は、こちらのリンクをコピーしてブラウザのアドレスバーに貼り付けてページを開いてください。
              <br />
              <br />
              ▽メッセージの返信用URL
              <br />
              <Link style={anchor} href={chattingThreadLink}>
                {chattingThreadLink}
              </Link>
              <br />
              ▽お取引に関するよくある質問
              <br />
              <Link
                style={anchor}
                href="https://faq.tsunagu-market.jp/?q=%E5%8F%96%E5%BC%95"
              >
                https://faq.tsunagu-market.jp/?q=%E5%8F%96%E5%BC%95
              </Link>
              <br />
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
