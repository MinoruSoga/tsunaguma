import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'
import React from 'react'

import { Footer } from './footer'

export default function RegisterStorePremiumComplete(props) {
  const { year } = props

  return (
    <Html>
      <Head />
      <Preview>
        いつもつなぐマーケットをご利用いただき、誠にありがとうございます。
      </Preview>
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
              いつもつなぐマーケットをご利用いただき、誠にありがとうございます。
              <br />
              つなぐマーケットでの出店者登録を受け付けました。
              <br />
              <br />
              【ご出店プラン】プレミアム
              <br />
              <br />
              つなぐマーケットにご出店いただくにあたり、ショップ設定や作品出品方法のご案内させていただきます。
              <br />
            </Text>
            <Text style={heading}>▽ショップ設定</Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              お客さまがあなたのショップを訪れたときに、お店の雰囲気が伝わり安心してお買い物していただけるよう、ショップのプロフィールを充実させましょう。
              <br />
              <br />
              １．マイページにログインしましょう。
              <br />
              ２．マイページ＞サイドメニュー＞ショップ設定をクリックしましょう。
              <br />
              ３．ショップ設定＞「ショップ情報」「振込先口座」を設定しましょう。
            </Text>
            <Hr style={hr} />
            <Text style={heading}>▽作品出品（納品）方法</Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              マイページから納品申請を行い、つなぐマーケットへ作品を発送（納品）することで出品ができます。
              <br />
              <br />
              １．マイページにログインしましょう。
              <br />
              ２．マイページ＞サイドメニュー＞納品申請をクリックしましょう。
              <br />
              ３．納品申請ページで必要な項目へ入力を行い、申請するをクリックしましょう。
              <br />
              ４．納品申請依頼書をプリントアウトし、申請した作品とともにつなぐマーケットへ発送しましょう。
              <br />
              <br />
              ※納品作品は、つなぐマーケットで受取り後、約3～4週間でサイトへ公開いたします。
            </Text>
            <Hr style={hr} />
            <Text style={heading}>▽作品送り先住所</Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              〒370-3522
              <br />
              群馬県高崎市菅谷町20-253 <br />
              きもの３６５株式会社 つなぐマーケット宛
            </Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              登録をすすめていただく中でお困りの点がございましたら、下記「ご出品ガイド」もご参考にしてください。
              <br />
              ご出品ガイド：https://faq.tsunagu-market.jp/--633527739b7b3e001ddf9de2
              <br />
              <br />
              今後とも『つなぐマーケット』をよろしくお願いいたします。
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

const heading = {
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#525f7f',
}

const paragraph = {
  color: '#525f7f',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  fontSize: '16px',
  lineHeight: '28px',
  textAlign: 'left' as const,
}
