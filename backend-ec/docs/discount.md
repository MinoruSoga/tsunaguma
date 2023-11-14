## Point reward system

- How many reward points are awarded per JPY spent (1 reward point for every ￥ 1)
- How much each reward point is worth when applied to a purchase (1 reward point is worth ￥ 1)
- Which products provide reward points when purchased => All products
- Which products can have reward points applied to them when purchased => All products
- Expire time of points
- Will you award points for anything besides purchases, e.g. welcome a new customer with a few points to "get them started?"
- Can you set up a system to remind customers if they have reward points they haven't used? Customers who shop from many different stores can accumulate lots of points and forget they even have them.
- How do you want your customers to be able to redeem their points?

## Feature

- Apply rewards only for orders in status (only when order is completed, customer can not earn points and then cancel the order before the shipment)
- Rewards point expiration enabled
- Days to expire
- Send email before expiration ?
- Days to Send Email before Expiration ?

## Events to reward points

- New registration ??
- After purchase
- After review product ??
- ...

## Add discount to cart

- Discount rule: fixed, allocation type: fixed

## Add field to cart

## After order complete | shipped

- descrease point of that order used point
- increase point of cusomter based on that order's total (tax or not ??)

### discountService

- calculateDiscountForLineItem() => overide

### totalsService

- getDiscountTotal() => overide

### cartService

- decorateTotals()

=> Should omit discounts when create child orders from parent order when order is placed or not ???

## Refund

- fix original price of cart and order: original_total = subtotal + shipping_total + gift_cover_total (not include any taxes)
- find the best way to distribute point from parent order to child order
- refund point when child order cancel completed

### Refund TODO

- refund money (GMO) when child order completed

## Promotion code

- Frontend check if the code that users is going to use is valid (exist, not expired) or not
- Send the id of the discount to the backend
- Backend check and apply the discount to cart
