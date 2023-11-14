export function convertPointToMoney(point: number) {
  return point / 1
}

export function convertMoneyToPoint(subtotal: number) {
  return Math.floor(subtotal * 0.9 * 0.01)
}
