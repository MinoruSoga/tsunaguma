import { isNil } from 'lodash'

function numberToAZ(n: number): string {
  if (n <= 0) {
    return ''
  }
  return numberToAZ(Math.floor(--n / 26)) + String.fromCharCode((n % 26) + 65)
}

export function converNumberToAz(n: number, startFrom = 26) {
  return numberToAZ(n + startFrom)
}

export function formatNumberJP(val: string | number) {
  if (isNil(val) || val === '') return ''

  if (typeof val === 'string') val = Number(val)
  if (isNaN(val)) return ''

  const formatter = new Intl.NumberFormat('ja-JP')

  return formatter.format(val)
}
