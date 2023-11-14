/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerOptions } from 'winston'

declare module 'winston' {
  type LogLevelType =
    | 'error'
    | 'warn'
    | 'info'
    | 'http'
    | 'verbose'
    | 'debug'
    | 'silly'
}
