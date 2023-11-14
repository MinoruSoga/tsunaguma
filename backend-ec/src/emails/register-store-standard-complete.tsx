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

export default function RegisterStoreStandardComplete(props) {
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
              【ご出店プラン】スタンダード
              <br />
              <br />
              これからつなぐマーケットにご出店いただくうえで、最初に設定していただきたいポイントを3つご案内させていただきます。
            </Text>
            <Text style={heading}>POINT１．プロフィールの設定</Text>
            <Text style={paragraph}>
              お客さまがあなたのショップを訪れたときに、お店の雰囲気が伝わり安心してお買い物していただけるよう、ショップのプロフィールを充実させましょう。
              <br />
              <br />
              プロフィールは［マイページ＞ショップ設定＞ショップ情報編集］から設定が行えます。
              <br />
              ショップ情報編集画面で設定できるのは以下の項目です。
              <br />
              ・プロフィール画像
              <br />
              ・ショップ名・肩書
              <br />
              ・プロフィール（＝自己紹介）
              <br />
              ・つなぐマーケット内でのショップURL
              <br />
              ・紹介画像
              <br />
              ・SNSアカウント（Instagram/Twitter/Facebook）
              <br />
              ・WebサイトURL（ご自身のHP・ショップページ等）
              <br />
            </Text>
            <Text style={heading}>POINT２．配送方法の設定</Text>
            <Text style={paragraph}>
              お客さまに作品をお届けする際の配送方法を設定しましょう。
              <br />
              配送方法を先に設定しておくと作品の登録をスムーズにおこなうことができます。
              <br />
              <br />
              配送方法と送料の設定は、［マイページ＞配送方法一覧・追加］から行えます。
              <br />
            </Text>
            <Text style={heading}>POINT３．オプションの設定</Text>
            <Text style={paragraph}>
              作品にオプションを設定することで、購入者が作品の詳細を選択できるようになります。
              <br />
              メッセージでのやりとりを減らし、スムーズなお取引につながります。
              <br />
              <br />
              オプションテンプレートの設定は、［マイページ＞オプション一覧・追加］から行えます。
              <br />
            </Text>
            <Text style={heading}>
              それでは、作品を出品しましょう！
              <br />
            </Text>
            <Text style={paragraph}>
              ここまでの設定が完了したら、つなぐマーケットで作品を販売する準備が整います。
              <br />
              <br />
              ［マイページ＞作品登録］からあなたの作品を登録しましょう。
              <br />
              登録をすすめていただく中でお困りの点がございましたら、下記「ご出品ガイド」もご参考にしてください。
              <br />
              ご出品ガイド：
              <br />
              （PC版）https://www.kimono-365.co.jp/tsunagumarket/Tsunagu_Market_Manual-PC.pdf
              <br />
              （スマホ版）https://www.kimono-365.co.jp/tsunagumarket/Tsunagu_Market_Manual-SP.pdf
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
