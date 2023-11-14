- Specs

  - Edit button: can only be pressed when status is draft
  - Cancel button: can only be pressed when status is draft or applying
  - In stock and out of stock will be deleted

- Questions
  - what does "全ての納品申請を表示 同列の評価の場合は登校日の新たしいものを優先" mean?
  - Not clear about background and shooting accessories
  - Two pull downs in the delivery app input page

## Create delivery request

- For each delivery request (in transaction)
  - create product
    - create variant first if have variants
    - call create product in product service (with status = delivery_request)
  - create request
    - create parent
    - create children
- total_stock
  - when create new delivery request => sum(variant.delivery_quantity), variant.inventory_quantity = 0
  - when add stock => sum(variant.delivery_quantity)
- api cancel (when pending)
- api add stock (when delivered)
- api update delivery request (when draft)

```json
  "delivery_request_variant": {
        "delivery_request_id": "string",
        "variant_id": "string",
        "delivery_quantity": "number"
   }
```
