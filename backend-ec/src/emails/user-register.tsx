import { Button } from '@react-email/button'
import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'
import * as React from 'react'

import { Footer } from './footer'

export default function UserRegister(props) {
  const { link, expiresAt, year } = props

  return (
    <Html>
      <Head />
      <Preview>【つなぐマーケット】会員登録 URL のご案内</Preview>
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
              この度はつなぐマーケットへの会員登録をご希望いただき、誠にありがとうございます。
              <br />
              下記のボタンをクリックして会員登録へお進みください。
              <br />
            </Text>
            <Text style={smaller}>
              ※ページが開かない場合、ボタン下部のURLをコピーしてブラウザのアドレスバーに貼り付けてページを開いてください。
            </Text>
            <Section style={center}>
              <Button href={link} pX={10} pY={10} style={button}>
                会員登録
              </Button>
              <Text style={label}>会員登録ページ：</Text>
              <table
                style={tableStyle}
              >
                <tbody>
                  <tr>
                    <td
                      style={tableTdStyle}
                    >
                      {link}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>
            <Text style={paragraph}>有効期限：{expiresAt}</Text>
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

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const label = {
  color: '#525f7f',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '13px',
  lineHeight: '18px',
  wordBreak: 'break-all' as const,
  textAlign: 'left' as const,
  margin: '16px 0 5px',
}

const tableStyle = {
  width: '100%',
  // tableLayout: 'fixed',
  height: 'auto',
  border: 'none',
  wordBreak: 'break-all' as const,
  textAlign: 'left' as const,
}

const tableTdStyle = {
  verticalAlign: 'top'
}

const smaller = {
  color: '#525f7f',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '13px',
  lineHeight: '18px',
  wordBreak: 'break-all' as const,
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
  wordBreak: 'break-all' as const,
  textAlign: 'left' as const,
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
  width: '200px',
  margin: '0 auto',
}

const footer = {
  color: '#8898aa',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '12px',
  lineHeight: '16px',
}
