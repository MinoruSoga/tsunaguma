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

export default function OrderCancelComplete(props) {
  const {
    created_at,
    id,
    nickname,
    display_id,
    purchaseHistoryLink,
    pointListLink,
    contactLink,
    year,
  } = props

  const preview = `${created_at} ご注文のキャンセルに関しまして`

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
              {nickname}様 <br />
              <br />
              この度つなぐマーケットで下記のご注文がキャンセルとなりましたのでご連絡させていただきます。{' '}
              <br />
            </Text>
            <Text style={heading}>【キャンセル内容】</Text>
            <Text style={callout}>
              {created_at} の注文 <br />
              <br />
              注文ID：{display_id}T <br />
            </Text>
            <Hr style={hr} />
            <Text style={smaller}>
              ご注文の内容は会員ページの「購入履歴詳細」でもご確認いただけます。{' '}
              <br />
              ▽ つなぐマーケット会員ページ「購入履歴詳細」 <br />
              {purchaseHistoryLink}/{id} <br />
              <br />
              ◆ クレジットカードでお支払いの方へ <br />
              既にお支払いが完了していた場合、お支払いのキャンセルが行われますのでご安心ください。{' '}
              <br />
              ご不明点がございましたらご利用のクレジットカード会社様へご確認ください。
              <br />
              <br />
              ◆ 注文時にポイントをご利用いただいた場合 <br />
              ご利用いただいたポイントは返還しておりますので、下記ページにてポイント残高をご確認ください。
              <br />
              ▽「所持ポイント」 <br />
              {pointListLink} <br />
              <br />
              この度のキャンセルについてご不明な点がございましたら下記よりご連絡ください。{' '}
              <br />
              ▽「お問い合わせ」
              <br />
              {contactLink} <br />
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
