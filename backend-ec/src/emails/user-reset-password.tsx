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

export default function UserResetPassword(props) {
  const { nickname, link, expiresAt, year } = props

  const preview = `有効期限：${expiresAt}`

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

            <Text style={calloutSmaller}>
              本メールは、パスワード再設定のお手続きをいただくお客様に送信しております。
              <br />
              お心当たりのない場合は、お手数ですがメールの削除をお願いいたします。
            </Text>

            <Text style={paragraph}>
              {nickname}様<br />
              <br />
              いつもつなぐマーケットをご利用いただき、誠にありがとうございます。
              <br />
              パスワードの再設定を受け付けました。
              <br />
              <br />
              下記のボタンをクリックして、パスワードの再設定を行ってください。
              <br />
              再設定用ページにアクセスし、パスワードの再設定をするまでパスワードは変更されません。
            </Text>
            <Text style={smaller}>
              ※ページが開かない場合、ボタン下部のURLをコピーしてブラウザのアドレスバーに貼り付けてページを開いてください。
            </Text>
            <Section style={center}>
              <Button href={link} pX={10} pY={10} style={button}>
                パスワードの再設定
              </Button>
              <Text style={label}>パスワードの再設定ページ：</Text>
              <textarea style={textarea} readOnly defaultValue={link}></textarea>
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

const smaller = {
  color: '#525f7f',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '13px',
  lineHeight: '18px',
  textAlign: 'left' as const,
}

const label = {
  color: '#525f7f',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '13px',
  lineHeight: '18px',
  wordBreak: 'break-all' as const,
  textAlign: 'left' as const,
  margin: '16px 0 5px'
}

const textarea = {
  width: '100%',
  resize: 'none' as const,
  height: '8em',
  border: 'none'
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

const calloutSmaller = {
  ...smaller,
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
