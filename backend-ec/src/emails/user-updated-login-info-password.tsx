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

import { Footer } from './footer'

export default function UserUpdatedLoginInfoPassword(props) {
  const { nickname, contactLink, year } = props

  const preview = `パスワードの変更が完了しました`

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
              パスワードを変更しました。
              <br />
              <br />
              <br />
              <br />
              パスワードの変更にお心当たりがなく、お持ちのパスワードでログインできない場合は、
              <br />
              第三者がパスワード変更をした可能性がございますので至急事務局までご連絡ください。
            </Text>
            <Section style={center}>
              <Button href={contactLink} pX={10} pY={10} style={button2}>
                お問い合わせ
              </Button>
            </Section>
            <Text style={smaller}>
              ▽お問い合わせ
              <br />
              <Link style={anchor} href={contactLink}>
                {contactLink}
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
