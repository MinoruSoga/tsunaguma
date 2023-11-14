## API tạo cart => dùng lại của medusa, ko có vấn đề gì

- khi thêm cart => nếu ko truyền region lên medusa sẽ auto lấy region đầu tiên trong db -`The region a cart is associated with determines the currency the cart uses, the tax, payment, and fulfillment providers, and other details and options. So, make sure you use the correct region for a cart.`
- Ban đầu là customer_id là null (chưa đăng nhập, nhưng sau khi đăng nhập vào, bên fe call API update cart để đổi customer_id của cart gắn với user vừa đn)

```js
medusa.carts
  .update(cartId, {
    customer_id,
  })
  .then(({ cart }) => setCart(cart))
```

## API thêm line-item vào cart (ở màn hình product detail, thêm sản phẩm vào giỏ hàng)

- Vấn đề:
  - Đang vướng phần quan hệ giữa line item với store, cần làm thế nào để gắn store_id vào một line_item khi add to cart
  - Khi thêm hoặc cập nhật cart, ko chỉ gửi lên só lượng, variant_id mà còn cần gửi lên những addon của item đó để thêm mới hoặc cập nhật vào bảng LineItemAddon nữa
- Hướng giải quyết: đã thử dùng beforeInsert và subscriber nhưng ko đc => cần anh Hải hướng dẫn thêm
  => API thêm của medusa ko tái sử dụng đc
  ​
  ​=> override CardService ( addLineItem, updateLineItem )

```js
medusa.carts.lineItems
  .create(cartId, {
    variant_id,
    quantity: 1,
  })
  .then(({ cart }) => setCart(cart))
```

​

## Màn hình cart

​

### API lấy ra những line item của cart, phải bao gồm thông tin của shop để bên fe chia nhóm các line item

- Hiện tại nếu theo bên API có sẵn của medusa thì nó vẫn trả về cart với các items, mình vẫn lấy được store_id thông qua item.store_id
- Trong các line_item trả về thì mình có những trường price sau đây
  ​

```json
{
  "subtotal": 100,
  "discount_total": 0,
  "total": 100,
  "original_total": 100,
  "original_tax_total": 0,
  "tax_total": 0
}
```

​

- Còn cart thì sẽ trả về các trường giá như sau:
  ​

```json
{
  "shipping_total": 0,
  "subtotal": 100,
  "discount_total": 0,
  "item_tax_total": 0,
  "shipping_tax_total": 0,
  "gift_card_total": 0,
  "gift_card_tax_total": 0,
  "tax_total": 0,
  "total": 100
}
```

​

- Trong đó, clear nhất là phần subtotal (đối với trường hợp line_item sẽ gắn với unit_price) = quantity \* unit_price
- Còn các trường khác sẽ được tính theo cách của medusa => trả về total là giá sau khi đã tính toán hết
- Hiện h mình chưa cần mấy loại kia, chỉ cần cái subtotal, có thêm giá của các addon vào
  => Vấn đề là h bên backend sẽ custom lại để cách tính giá hay để frontend tự tính
- Hướng giải quyết: nghiêng về hướng sẽ trả ra giá unit_price, quantity, và addon_subtotal_price, bên fe tự tính giá của mỗi line_item (nhưng làm thế này thì trường total của phần line_item và cart sẽ ko còn ý nghĩa nữa, bên fe phải tự tính giá hết)
- Chỗ này cần phải join với bảng LineItemAddons để lấy được giá các addon => từ đó tính được addon_subtotal_price
  => Khả năng là không tận dụng đc API của medusa
- Giá này khác phức tạp, sau này liên quan nhiều cái,hiện tại chưa chốt đc phần giá của line_item và cart xử lý thế nào => cần anh Hải hướng dẫn
  ​

### API lấy thông tin của shop theo id

​

- Phải lấy đc tên shop, free_shipping của shop => Gọi API get store by id anh Hoàng đã viết
- Vấn đề: nếu nhiều store => phải call nhiều api
  ​

### API Update line item quantity => sử dụng được API update lineItem in cart của medusa

​

```js
medusa.carts.lineItems
  .update(cartId, lineItemId, {
    quantity: 3,
  })
  .then(({ cart }) => setCart(cart))
```

​

### API Delete line item in cart => sử dụng được API delete lineItem in cart của medusa

​

```js
medusa.carts.lineItems
  .delete(cartId, lineItemId)
  .then(({ cart }) => setCart(cart))
```

​

## Step 1: Địa chỉ giao hàng

​

### API get customer info => có sẵn của medusa

- Lấy ra thông tin của customer để có được trường billing_address_id => biết được địa chỉ nào đang được đặt làm mặc định, lấy được tất cả các shipping address của người đó
- Vấn đề: nó sẽ lấy hết các address luôn, mình muốn là nó chỉ lấy những address có is_show = true thôi
- Hướng giải quyết: viết lại API này
  ​

### API update user info => có sẵn của medusa

- Dùng để update trường billing_address_id của customer khi người đó muốn chọn địa chỉ khác làm địa chỉ mặc định
  ​

### API Thêm một địa chỉ mới => có sẵn của medusa

- Dùng để thêm thông tin của địa chỉ nhận (shipping address) hoặc địa chỉ nguời mua (billing address)
- Vấn đề: hiện tại sdk và validator của api này ko cho truyền lên trường is_show (có hiện địa chỉ này hay ko)
- Hướng giải quyết: mong muốn ghi đè được sdk và validator của api này (giống như anh Hải làm chỗ product) => cần anh Hải sp
  ​

### API xóa một address khỏi danh sách shipping address của user đó

=> dùng lại hoàn toàn của Medusa
​

### API Chinh sửa địa chỉ nhận hàng => có sẵn của medusa

- tương tự trường hợp thêm địa chỉ, cần custom lại sdk và validator để thêm được trường is_show vào
  ​

### Bảng order có cần thêm 2 trường is_own và is_gift hay ko

​

## Step 2: Chọn phương pháp vận chuyển

​

### API lấy ra các item của cart

- Lần này các line item trong cart lấy ra phải có thông tin của các shipping_options nữa => Khả năng phải viết một api riêng
  ​

## Step 4 Xác nhận những thông tin của đơn hàng

​

### API lấy ra các item của cart => dùng lại của medusa đc

​

- Sau mỗi bước, goi api update cart để cập nhật những thông tin nguời dùng đã nhập ở bước đó
  - Ví dụ ở bước 1, khi hoàn thành bước 1 thì gọi api update lại shipping address và billing address của đơn hàng
  - Ở bước 2, gọi api update cart để truyền lên các line item đã chọn shipping option, và gift cover
  - Bước 4 sẽ hiển thị cart có đủ thông tin từ bước 1,2,3 rồi
    ​
    => Dự định viết lại API update cart vì chỗ này có nhiều trường mới so với api cũ
    ​
- Những thông tin liên quan đến order thì lưu ở local
