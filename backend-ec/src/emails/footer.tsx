import { Hr } from '@react-email/hr'
import { Link } from '@react-email/link'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'
import * as React from 'react'

export function Footer(props) {
  const { year } = props

  return (
    <Section style={box}>
      <Text style={paragraph}>
        ※このメールアドレスは送信専用となります。直接ご返信されないようお願いいたします。
      </Text>
      <Hr style={hr} />
      <Text style={paragraph}>
        つなぐマーケット
        <br />
        <Link style={anchor} href="https://www.tsunagu-market.jp/">
          https://www.tsunagu-market.jp/
        </Link>
        <br />
        お問い合わせ　 E-Mail :{' '}
        <Link style={anchor} href="mailto:info@tsunagu-bur.jp">
          info@tsunagu-bur.jp
        </Link>{' '}
        <br />
      </Text>
      <Hr style={hr} />
      <Text style={paragraph}>
        つなぐマーケット公式 SNS アカウント
        <br />
        ▼Instagram
        <br />
        <Link style={anchor} href="https://www.instagram.com/tsunagu_market/">
          https://www.instagram.com/tsunagu_market/
        </Link>
        <br />
        <br />
        着物のレンタル・販売サイト
        <br />
        ▼ きもの 365
        <br />
        <Link style={anchor} href="https://www.kimono-365.jp">
          https://www.kimono-365.jp
        </Link>
        <br />
      </Text>
      <Hr style={hr} />
      <Text style={footer}>©{year} つなぐマーケット</Text>
    </Section>
  )
}

const box = {
  padding: '0 48px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '10px 0',
}

const paragraph = {
  color: '#525f7f',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'left' as const,
}

const anchor = {
  color: '#F06B02',
}

const footer = {
  color: '#8898aa',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '12px',
  lineHeight: '16px',
}
