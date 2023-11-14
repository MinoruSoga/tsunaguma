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
import { Footer } from './footer'

export default function FavoriteProductOnSale(props) {
  const { product, nickname, year, salePrice } = props

  const preview = `【つなぐマーケット】お気に入り作品がセール価格になりました`
  const config = loadConfig()
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
              いつもつなぐマーケットをご利用いただき、誠にありがとうございます。
              <br />
              <br />
              お気に入り作品がセール価格になりました。
              <br />
              お得なこの機会に、ぜひお買い物をお楽しみください。
              <br />
              <br />
            </Text>
            <Hr style={hr} />
            <Text style={heading}>【SALE】 </Text>
            <Text style={callout}>
              作品名 ：{product.title}
              <br />
              作品URL ：
              <Link
                style={anchor}
                href={config.frontendUrl.productDetail(product.id)}
              >
                {config.frontendUrl.productDetail(product.id)}
              </Link>
              <br />
              価格 ：{salePrice}円
              <br />
              <br />
              お気に入り作品一覧はこちら
              <br />
              <Link style={anchor} href={config.frontendUrl.favorites}>
                {config.frontendUrl.favorites}
              </Link>
            </Text>
            <Hr style={hr} />
            <br />
          </Section>
          <Footer year={year} />
        </Container>
      </Section>
    </Html>
  )
}

const anchor = {
  color: '#F06B02',
}

const main = {
  backgroundColor: '#f6f9fc',
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
