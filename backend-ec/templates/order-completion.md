【つなぐマーケット】ご注文ありがとうございました

{{order.customer.nickname}}様 <br/>

この度は作品をご注文くださいまして誠にありがとうございます。<br/>
ご注文情報をご確認ください。<br/>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ <br/>
{{order.created_at}} の注文 <br/>

## 受付 ID：{{order.display_id}} <br/>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ <br/>

{{#order.children}}

### 注文 ID ： {{display_id}} <br/>

<br/>
{{#items}}
作品名 ： {{ variant.product.title }} <br/>
URL ： {{ url }} <br/>
価格 ： {{ total_unit_price }}円 <br/>
数量 ： {{ quantity }}個 <br/>
小計 ：{{ subtotal }}円 <br/>
配送方法 ： {{ shipping_method.shipping_option.name }} <br/>
発送までの目安： {{ variant.product.ship_after }}日後
<br/>

<br/>
{{/items}}

送料 ：{{ shipping_total }}円 <br/>
合計金額 ： {{ total }}円 <br/>

<br/>
<br/>
{{/order.children}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ <br/>
お届け先：{{order.shipping_address.prefecture.name}}, {{order.shipping_address.address_1}}, {{order.shipping_address.address_2}}<br/>
決済方法： {{ order.payment_method }} <br/>
クーポン利用： {{ order.coupon_total }} 円 <br/>
使用ポイント： {{ order.point_used }} Ｐ <br/>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ <br/>

作品が発送されると発送完了メールが届きます。<br/>
出店者より作品が発送されるまでお待ちくださいませ。

━━━━━━━━━━━━━━━━ <br/>
つなぐマーケット
https://www.tsunagu-market.jp <br/>
お問い合わせ　 E-Mail : info@tsunagu-bur.jp <br/>
━━━━━━━━━━━━━━━━ <br/>
つなぐマーケット公式 SNS アカウント <br/>
▼Instagram <br/>
https://www.instagram.com/tsunagu_market/<br />

着物のレンタル・販売サイト <br/>
▼ きもの 365 <br/>
https://www.kimono-365.jp<br/>
━━━━━━━━━━━━━━━━
