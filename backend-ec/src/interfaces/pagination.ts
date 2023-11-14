export type PaginationType<T> = {
  count: number // total items
  items: T[] // current page items
}
