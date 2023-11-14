import type * as TestFunctions from './sum'

const { sum } = jest.requireActual<typeof TestFunctions>('./sum')

describe('test sum', () => {
  it('test sum function', () => {
    expect(sum(1, 2)).toBe(3)
  })
})
