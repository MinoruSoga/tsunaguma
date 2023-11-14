# DB

## User => UserModule

```json
{
  "nickname": "string",
  "user_type": "admin_admin | admin_staff | customer | store_standard | store_prime",
  "store_id": "=> store.id nullable", // null: customer
  "status": "actived | banned",
  "avatar": "url"
}
```

- admin
  - system
  - admin / staff
  - not log in to front ( not buy )
- register
  - customer
    - buy
    - not sell
  - store register
    - standard
      - self sell
    - prime
      - admin sell

## Store => StoreModule

```json
{
  "id": "store_admin => admin, store_{user_id} => store_*",
  "plan_type": "standard | prime",
  "business_form": "personal | company",
  "user_id": "user.id nullable, null => admin, notNull => store_*",
  "status": "pending | approved | rejected | banned"
}
```

## Customer => UserModule

```json
{
  "id": "user.id",
  "email": "user.email"
}
```

## Product => ProductModule

- `product`

```json
{
  "title": "string", // ok
  "desc": "string", // ok description
  "is_maker_ship": "boolean",
  "type_id": "product_type.id", // ok type_id
  "type_lv1_id": "type.id",
  "type_lv2_id": "type.id",
  "status": "draft | published => sale | proposed => exhibit | rejected => disabled", // ok product' info will be save on metadata when draft
  "is_customize": "boolean",
  "gift_cover": "none | free | pay",
  "ship_from_id": "pref.id",
  "profile_id": "shipping_profile.id",
  "ship_after": "string",
  "remarks": "string",
  "material_id": "product_material.id",
  "material": "product_material.name", // ok
  "store_id": "store.id"
}
```

- `shipping_profile` => ShippingModule
  - after creating the store, the `shipping_profile` will be created auto

```json
{
  "store_id": "store.id"
}
```

- `shipping_option` => ShippingModule

```json
{
  "id": "string", // ok
  "name": "string", // ok
  "provider_id": "fulfillment_provider.id", // already has in ShippingOption Medusa
  "provider_name": "string", // for free-input
  "size_id": "fulfillment_provider.metadata.sizes.id", // nullable
  "size_name": "string", // for free-input
  "is_docs": "boolean",
  "is_trackable": "boolean", // fulfillment_provider.is_trackable | free-input
  "is_warranty": "boolean", // fulfillment_provider.is_warranty | free-input
  "data": {
    // already has in ShippingOption Medusa
    //ok
    "all": "number", // 全国一律
    "prefs": {
      "[prefecture.id]": "number" // prefecture.id
    }
  }
}
```

- `fulfillment_provider` => ShippingModule

```json
{
  "id": "string", // ok
  "name": "string",
  "is_free": "boolean",
  "is_trackable": "boolean",
  "is_warranty": "boolean",
  "metadata": {
    "sizes": [
      {
        "id": "string",
        "name": "string"
      }
    ]
  }
}
```

- `pref` => PrefectureModule

```json
{
  "id": "string",
  "name": "string",
  "parent_id": "pref.id"
}
```

- `product_images` => ProductModule

```json
{
  "product_id": "product.id", // ok
  "image_id": "image.id", // ok
  "rank": "number"
}
```

- `image` => ProductModule

```json
{
  "id": "string", // ok
  "store_id": "store.id",
  "url": "string" // ok ==> auto resize
}
```

- `product_specs` => ProductModule

```json
{
  "product_id": "product.id",
  "lv1_id": "product_spec.id",
  "lv2_id": "product_spec.id",
  "lv2_content": "string",
  "lv3_id": "product_spec.id",
  "lv3_content": "string",
  "rank": "number"
}
```

- `product_spec` => ProductModule

```json
{
  "product_type": "type.id",
  "id": "string",
  "name": "string",
  "is_free": "boolean", // true: free input, false: select
  "parent_id": "product_spec.id"
}
```

- `product_sizes` => `product.metadata`

```json
{
  "sizes": [
    [
      {
        "size_id": "product_size.id",
        "is_free": "boolean",
        "value": "string",
        "name": "string"
      }
    ]
  ],
  "sizes_note": "string"
}
```

e.x:

```json
{
  "sizes": [
    [
      {
        "size_id": "prd_size_1", // size
        "is_free": "false",
        "value": "S",
        "name": "S"
      },
      {
        "size_id": "prd_size_4",
        "is_free": "false",
        "value": "100",
        "name": "身幅"
      },
      {
        "size_id": "prd_size_5",
        "is_free": "false",
        "value": "100",
        "name": "肩幅"
      },
      {
        "size_id": "prd_size_6",
        "is_free": "false",
        "value": "100",
        "name": "袖丈"
      },
      {
        "size_id": "prd_size_7",
        "is_free": "false",
        "value": "100",
        "name": "着丈"
      },
      {
        "size_id": "prd_size_7",
        "is_free": "false",
        "value": "100",
        "name": "ヒールの高さ"
      },
      {
        "size_id": "prd_size_7",
        "is_free": "false",
        "value": "100",
        "name": "高さ"
      }
    ]
  ],
  "sizes_note": "注意：サイズは仮です。\nフリーです。"
}
```

- `product_size` => ProductModule

```json
{
  "product_type": "type.id",
  "id": "string",
  "is_free": "boolean",
  "name": "string",
  "desc": "string",
  "unit": "string",
  "image": "string"
}
```

e.x:

```json
[
  {
    "product_type": "prd_type_123",
    "id": "prd_size_1",
    "is_free": "false",
    "is_selectable": "true", // for size
    "rank": "1",
    "name": "S",
    "desc": "",
    "unit": "",
    "image": ""
  },
  {
    "product_type": "prd_type_123",
    "id": "prd_size_2",
    "is_free": "false",
    "is_selectable": "true", // for size
    "rank": "1",
    "name": "M",
    "desc": "",
    "unit": "",
    "image": ""
  },
  {
    "product_type": "prd_type_123",
    "id": "prd_size_3",
    "is_free": "false",
    "is_selectable": "true", // for size
    "rank": "1",
    "name": "L",
    "desc": "",
    "unit": "",
    "image": ""
  },
  {
    "product_type": "prd_type_123",
    "id": "prd_size_3",
    "is_free": "true",
    "is_selectable": "true", // for size
    "rank": "1",
    "name": "フリー入力",
    "desc": "",
    "unit": "",
    "image": ""
  },
  {
    "product_type": "prd_type_123",
    "id": "prd_size_4",
    "is_free": "false",
    "is_selectable": "false",
    "rank": "2",
    "name": "身幅",
    "desc": "",
    "unit": "cm",
    "image": ""
  },
  {
    "product_type": "prd_type_123",
    "id": "prd_size_5",
    "is_free": "false",
    "is_selectable": "false",
    "rank": "3",
    "name": "肩幅",
    "desc": "",
    "unit": "cm",
    "image": ""
  },
  {
    "product_type": "prd_type_123",
    "id": "prd_size_6",
    "is_free": "false",
    "is_selectable": "false",
    "rank": "4",
    "name": "袖丈",
    "desc": "",
    "unit": "cm",
    "image": ""
  },
  {
    "product_type": "prd_type_123",
    "id": "prd_size_7",
    "is_free": "false",
    "is_selectable": "false",
    "rank": "5",
    "name": "着丈",
    "desc": "※後ろ襟ぐり中心からの長さ",
    "unit": "cm",
    "image": ""
  },
  {
    "product_type": "prd_type_123",
    "id": "prd_size_8",
    "is_free": "true",
    "is_selectable": "false",
    "rank": "6",
    "name": "フリー入力",
    "desc": "※後ろ襟ぐり中心からの長さ",
    "unit": "cm",
    "image": ""
  }
]
```

- `product_tag` => keyword
- `product_type` (category) => ProductModule

```json
{
  "id": "string", // ok
  "value": "string", // ok
  "parent_id": "product_type.id"
}
```

- `price_list` => ProductModule

```json
{
  "type": "'sale', 'override'", // ok
  "status": "'active', 'draft'", // ok
  "starts_at": "timestamp", // ok
  "ends_at": "timestamp" // ok
}
```

- `money_amount` => ProductModule

```json
{
  "variant_id": "product_variant.id", // ok
  "amount": "integer", // ok
  "price_list_id": "price_list.id" // ok for sale price
}
```

- `product_variant` => ProductModule
  - "color": `product_option.name`,
  - "size": `product_option.name`,

```json
{
  "product_id": "string", // ok
  "sku": "string", // ok
  "inventory_quantity": "number", // ok
  "allow_backorder": "boolean", // ok is order
  "variant_rank": "number" // ok
}
```

- `product_option` => StoreModule

  - init data when bootstrap

- `product_addons` => ProductModule

```json
{
  "product_id": "string",
  "lv1": "product_addon.id",
  "lv2": "product_addon.id"
}
```

- `product_addon` => StoreModule

```json
{
  "id": "string",
  "store_id": "store.id",
  "name": "string",
  "price": "number",
  "parent_id": "product_addon.id"
}
```

- `product_material` => ProductModule

```json
{
  "product_type": "string",
  "id": "string",
  "name": "string"
}
```

- `product_colors` => ProductModule

```json
{
  "product_id": "string",
  "color_id": "product_color.id"
}
```

- `product_color` => ProductModule

```json
{
  "id": "string",
  "name": "string",
  "code": "string" // # => for Hex code, other for thumbnail image
}
```

- `product_gift_cover` => `product.metadata`

```json
{
  "gift_covers": [
    {
      "thumbnail": "string",
      "name": "string",
      "price": "number"
    }
  ]
}
```

## Cart

### LineItem

```json
{
  "addon_subtotal_price": "number",
  "shipping_method_id": "shipping_method.id"
}
```

### LineItemAddons

```json
{
  "line_item_id": "line_item.id",
  "lv1_id": "product_addon.id", // lv1
  "lv2_id": "product_addon.id", // lv2
  "price": "number" // capture from product_addon
}
```

### LineItemGiftCovers => LineItem metadata

```json
{
  "gift_covers": [
    {
      "thumbnail": "string", // capture
      "name": "string", // capture
      "price": "number" // capture
    }
  ]
}
```

### Address

```json
{
  "is_show": "bool"
}
```

### Order

```json
{
  "cancel_status": ["pending", "accepted"],
  // order child
  "metadata": {
    // json
    "preferred_received_at": "datetime",
    "note": "string"
  },
  // order parent
  "metadata": {
    "info": [
      {
        "preferred_received_at": "datetime",
        "note": "string",
        "store_id": "string"
      }
    ]
  }
}
```

- tng status

  - payment pending: status-pending + payment_status-not_paid
  - paid: status-pending + payment_status-captured
  - ship pending: status-pending + fulfilment_status.fulfilled
  - shipped: status-pending + fulfilment_status.shipped
  - completed: status-completed
  - cancel request: status-canceled + cancel_status.pending
  - cancelled: status-canceled + cancel_status.accepted

- price

  - item's price
  - addon's price
  - ship's price

- status: `pending`, `completed`, archived, `canceled`, `return`, requires_action
- fulfiment_status: [`not_fulfilled`, partially_fulfilled, `fulfilled`, partially_shipped, `shipped`, partially_returned, returned, canceled, requires_action]
- payment_status: [`not_paid`, `awaiting`, `captured`, partially_refunded, `refunded`, `canceled`, requires_action]
- cancel_status: `pending`, `accepted`

### Point => TODO

# API

- Cart checkout ( context )

  - calc price => Luong (t2)
    - items
    - addons
    - shipping => `createShippingMethod`
  - checkout => Luong
    - calc price
    - payment (t3)
    - create order

- Order

  - list items store
  - list order buyer
  - detail ==> The (t2)
  - update ==> The (t3)
    - cancel_request
    - canncel cancel_request
  - accept cancel_request (t2)

- [api] Cart data

```json
{
  "items": [
    // totalsService.getLineItemTotals => override
    {
      "addon_subtotal_price": "number", // addons subtotal => override after `supper.getLineItemTotals()`
      "unit_price": "number", // lineItem.unit_price + lineItem.addon_subtotal_price => override before `supper.getLineItemTotals()`
      "quantity": "number",
      "subtotal": "number", // lineItem.unit_price * lineItem.quantity
      "discount_total": "number", // (lineItemAllocation.discount?.unit_amount || 0) * lineItem.quantity
      "total": "number", // total: (subtotal - discount_total) + tax_total,
      "original_total": "number", // subtotal + original_tax_total
      "original_tax_total": 0, // subtotal * taxRate (taxRate = cartOrOrder.tax_rate / 100)
      "tax_total": 0, // (subtotal - discount_total) * taxRate
      "tax_lines": [] // lineItem.tax_lines,
    }
  ],
  "shipping_methods": [
    // totalsService.getShippingMethodTotals => override
    // cart.item.shipping_method_id === shippingMethod.id => shop => total shop'items price > shop.free_shipping => total = 0
    // cartOrOrder.discounts.append(DiscountRuleType.FREE_SHIPPING) => supper.getShippingMethodTotals()
    {
      "price": "number", // shippingMethod.price
      "original_total": "number", // shippingMethod.price
      "original_tax_total": "number", // 0
      "tax_lines": [], // shippingMethod.tax_lines
      "total": "number", // discounts.rule.type === DiscountRuleType.FREE_SHIPPING => 0 | shippingMethod.price
      "subtotal": "number", // discounts.rule.type === DiscountRuleType.FREE_SHIPPING => 0 | shippingMethod.price
      "tax_total": "number" // discounts.rule.type === DiscountRuleType.FREE_SHIPPING => 0
    }
  ],
  "shipping_total": "number", // sum(shipping_methods.subtotal)
  "subtotal": "number", // sum(items.subtotal)
  "discount_total": "number", // sum(items.discount_total)
  "item_tax_total": "number", // sum(items.tax_total)
  "shipping_tax_total": "number", // sum(shipping_methods.tax_total)
  "tax_total": "number", // cart.item_tax_total + cart.shipping_tax_total
  "total": "number" // cart.subtotal + cart.shipping_total + cart.tax_total - cart.discount_total
}
```

- TODO
  - how to stock_quantity (change `allow_backorder` => `manage_inventory`) => ok
  - how to free-ship: `cart.update({ discounts })` => ok
  - ITaxCalculationStrategy
  - IPriceSelectionStrategy => ok
    - `originalPrice`, `calculatedPrice`, `calculatedPriceType`
    - https://docs.medusajs.com/advanced/backend/price-selection-strategy/
  - ICartCompletionStrategy => ok
  - PaymentProvider
    - https://docs.medusajs.com/advanced/backend/payment/how-to-create-payment-provider
    - GMO credit/debit card
    - GMO combini

## Restock API

```json
{
  "restock_request": {
    "id": "string",
    "user_id": "user.id", // not null, cascade
    "product_id": "product.id", // not null, cascade
    "variant_id": "variant.id", // not null, cascade
    // "store_id": "store.id", // nullable đang phân vân
    "created_at": "datetime",
    "updated_at": "datetime",
    "content": "string"
  }
}
```

### Currently available API

- Get all variants of a product: https://docs.medusajs.com/api/store/#tag/Product-Variant/operation/GetVariantsVariant
  => Để hiện thị bên frontend khi vào màn request restock

  ```Một số lưu ý:
  - Màn này phải có một param trên route (chính là variant_id, dùng để call api ở trên, lấy ra thông tin của variant => từ có có được thông tin của product nằm trong response luôn)
  - Khi api trả về kết quả bên fe phải check xem variant này có thực sự hết hàng (đủ điều kiện để restock hay ko, nếu ko redirect về 404 hoặc ko cho restock) => điều kiện để hêt hàng ntn ???
  manage_inventory = false || (manage_inventory = true &&  inventory_quantity > 0) => ko cho restock
  ```

### APIs nees to complete

- API create restock request
  - params: product_id, variant_id, loggedInUser.id
  - response: 200 (OK)
  - description: API này để tạo một restock request. Trước khi tạo phải check xem có đủ điệu kiện để tạo ko. Nếu thỏa mãn thì tạo => Insert vào bảng restock_request. Sau đó, tiến hành gửi mail cho shop (lấy từ product) và cho customer. Một customer có thể tạo nhiều request tùy ý
    product & variant exist => product, variant

### Listen product events to send email when product is restock

- Lắng nghe sự kiện gì? => ProductVariantService.Events.UPDATED, ProductVariantService.Events.DELETED
- Có thể tham khảo code ở `search.subscriber` để hiểu cách bắt sự kiện
- Khi variant update: (ProductVariantService.Events.UPDATED)
  - Check xem variant đó hết hàng hay còn hàng
  - Nếu ko còn hàng => ko làm gì
  - Nếu còn hàng => tiền hành gửi mail cho những user đã có restock request liên quan đến variant này
    Tìm trong bảng restock_request: { variant_id: data.id }, lấy ra được danh sách những người đã gửi request (user_id), sau đó gửi mail, và cuối cùng xóa những restock request có variant_id = variant vừa update (có có request nào thì ko gửi mail gì cả)
  - Bước trên phải viết trong service, làm trong transaction, emit event cũng trong transaction => quan trọng
- Khi variant deleted: (ProductVariantService.Events.DELETED) (optional)
  - Xóa những restock request liên quan đến variant này

### Redirect to restock request page

- Khi người dùng chọn một variant hết hàng
- Nhưng chưa clear được, khi sản phẩm hết hàng thì ko chọn đc variant đó, làm sao biết để redirect đến trang nào???
  => Cần hỏi lại chị Loan

## Shop status change

- Fix UI add to cart button in product detail page => Tu Anh
- Fix meilisearch not show products of inactive shops => Luong
- Fix function `updateStoreInformation` => remove logic change product status => only change shop status => Tu Anh

## Attachment when send inquiry

```json
{
  "attachment": {
    "id": "string",
    "url": "string", // s3 key after upload, not null
    "file_name": "string", // nullable
    "metadata": "json",
    "type": "string" // nullable
  },
  "inquiry_attachment": {
    "inquiry_id": "string",
    "attachment_id": "string"
  }
}
```

## Withdraw for customer, store_standard, store_premium

- read specs again
- clear condition to withdraw of customer, store_standard, store_premium
  - customer: at any time
  - premium: can not auto withdraw, but withdraw request can be made at any time
  - standard: not possible if has unshipped or shipped (but not completed) orders
- clear of what will happen to each user category after withdrawal
  - product
  - store
  - order (pending, prepare to ship)
  - thread, message
  - follow (user who withdrawn follow store or store which have followers)
  - ...
- design db and api endpoints for withdrawal functionality
- coding

  - migrate db
  - update login functionality
  - api withdraw
  - ...

- When an user withdraws from system:
  - can not log in with old account
  - but can register with completely new account
  - users can restore their accounts as long as their email are not currently registered
  - when users restore their accounts, withdrawn record will be deleted
- Login / Register Flow when implementing withdraw flow
  Each email can only have one active account at one time, but can multiple inactive account
  Each email can only have one approved or pending withdrawal at the same time, but can have multiple rejected withdrawals at the same time

  When create withdrawal:
  If user already have approved or pending withdrawal => just return, not do anything
  Check if this user can with drawn (condition specs)
  If user is customer or store standard => create a withdrawal with status approved
  If user is store prime => create a withdrawal with status pending
  ...

  When admin approve withdrawal request from shop premium
  If user does not have any pending request => return
  Check if this user can with drawn (condition specs)
  Change the status of approved request to approved
  ...

  When admin restore one user
  If user does not have any approved withdraw request => return
  Restore user, remove approved request
  ...f

  (1) User register an account (completely new account with diffrent email)
  (2) User use Tsunagu account
  (3) User withdraw from Tsunagu market
  (4) User create new account (same email as withdrawn account)
  (5) Admin restore account of that user

  (1) - (2)
  (1) - (2) - (3)
  (1) - (2) - (3) - (5)
  (1) - (2) - (3) - (4)

- Save withdrawn reason to redis cache

### User module

```json

{
  "withdrawal": {
    "id": "string",
    "user_id": "string", // not null
    "store_id": "string", // nullable
    "reason": "withdrawal_reason[]",
    "note": "text",
    "status": "approved" | "pending" | "rejected", // customer + store standard => approved, premium: pending => approved
    "metadata": "json"
  },
  "withdrawal_reason": {
       "id": "string",
       "value": "string", // not null
  },
  "user": {
     // ...,
     "status": "deleted"
  }
}
```

- Sematic versioning

  11.11.11 => major version:minor version:patch version

- Major version update:

  - used for big changes
  - not backwards-compatible
  - update from old version to new version will probably break old code

- Minor version update:
  - backwards-compatible features
  - won't break older builds (ideally)
- Patch version update

  - Small bug fixes
  - won't break older builds

- The caret symbol will update the package to the lastest minor and patch version for the currently installed
  major version

### Ranks

- Create new

  - Create new product published => ok
  - Create new product proposed => ok
  - Create new reject product => ok
  - Create new draft product => ok

- Update status

  - Update status from public => proposed => ok
  - Update status from proposed => public => ok
  - Update status from public => reject => ok
  - Update status from reject => public => ok
  - Update status from propose => reject => ok
  - Update status from reject => propose => ok

  - Update status from draft => public => ok
  - Update status from draft => propose => ok
  - Update status from draft => reject => ok

- Update bulk status

  - Update bulk status from public => proposed => ok
  - Update bulk status from proposed => public => ok
  - Update bulk status from public => reject => ok
  - Update bulk status from reject => public => ok
  - Update bulk status from propose => reject => ok
  - Update bulk status from reject => propose => ok
  - Update bulk status from publish => deleted => ok
