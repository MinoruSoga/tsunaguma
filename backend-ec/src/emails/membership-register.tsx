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

export default function MembershipRegister(props) {
  const { nickname, email, year, shop_register_link } = props

  return (
    <Html>
      <Head />
      <Preview>【つなぐマーケット】会員登録が完了しました</Preview>
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
              {nickname}様<br />
              <br />
              この度はつなぐマーケットへご登録いただき、誠にありがとうございます。
              <br />
              以下の内容で会員登録が完了しました。
              <br />
              <br />
              ニックネーム
              <br />
              {nickname}
              <br />
              <br />
              ご登録メールアドレス
              <br />
              {email}
              <br />
              <br />
              ショップとして出店を希望される方は、下記のボタンをクリックして出店申請へお進みください。
              <br />
            </Text>
            <Section style={center}>
              <Button href={shop_register_link} pX={10} pY={10} style={button}>
                出店申請
              </Button>
              <Text style={smaller}>
                ※ページが開かない場合、ボタン下部のURLをコピーしてブラウザのアドレスバーに貼り付けてページを開いてください。
                <br />
                <br />
                ▽「出店申請」
                <br />
                {shop_register_link} <br />
              </Text>
            </Section>
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
