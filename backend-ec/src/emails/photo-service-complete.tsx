import { Container } from '@react-email/container'
import { Head } from '@react-email/head'
import { Hr } from '@react-email/hr'
import { Html } from '@react-email/html'
import { Img } from '@react-email/img'
import { Preview } from '@react-email/preview'
import { Section } from '@react-email/section'
import { Text } from '@react-email/text'

import {
  Store,
  StorePhotoServiceEnum,
} from '../modules/store/entity/store.entity'
import { Footer } from './footer'

const photoServiceOptions = [
  {
    label: 'ベーシック撮影',
    value: StorePhotoServiceEnum.BASIC,
  },
  {
    label: 'カスタマイズ撮影',
    value: StorePhotoServiceEnum.CUSTOMIZED,
  },
  {
    label: 'ロケ・モデル撮影',
    value: StorePhotoServiceEnum.LOCKET,
  },
]

const getPhotoService = (type: StorePhotoServiceEnum) => {
  return photoServiceOptions.find((p) => p.value === type)?.label
}

export default function PhotoServiceComplete(props: {
  store: Store
  year: any
  contract: any
}) {
  const { store, year, contract } = props

  const preview = `【つなぐマーケット】撮影サービスのお申込みを受け付けました`
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
              {store.name}さん <br />
              会員ID: {store.display_id}S
              <br />
              <br />
              この度は撮影サービスにお申込みいただき、誠にありがとうございます。
              <br />
              以下の内容でお申し込みを受付いたしました
              <br />
              <br />
              ショップ名：{store.name}
              <br />
              <br />
              氏名：{store.store_detail.firstname} {store.store_detail.lastname}
              <br />
              <br />
              メールアドレス：{store.owner.email}
              <br />
              <br />
              電話番号：{store.store_detail.tel_number}
              <br />
              <br />
              お申し込みオプション：撮影サービス/
              {getPhotoService(contract.type)}
              {contract.note ? (
                <>
                  <br />
                  <br />
                  ご質問等ございましたらご記入ください：
                  <br />
                  {contract.note}
                </>
              ) : null}
              <br />
              <br />
              後ほど担当者よりご連絡させていただきますので、しばらくお待ちください。
            </Text>
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
