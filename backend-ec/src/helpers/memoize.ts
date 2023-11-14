import fs from 'fs/promises'
import memoizee from 'memoizee'
import ms from 'ms'

export const memoizedMs = memoizee(ms)
export const memoizedReadfile = memoizee(fs.readFile)
