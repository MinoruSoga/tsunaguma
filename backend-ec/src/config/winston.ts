import 'winston-daily-rotate-file'

import winston, { addColors, LoggerOptions, transports } from 'winston'

import loadConfig from '../helpers/config'

type TransportKey = 'file' | 'console' | 'file-rotate'
type ExtendedFileTransportOptions = Omit<
  transports.FileTransportOptions,
  'maxFiles'
> & {
  datePattern?: string
  maxSize?: string | number
  maxFiles?: string | number
}

const config = loadConfig()

const alignColorsAndTime = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.label({
    label: '[API CALL]',
  }),
  winston.format.timestamp({
    format: 'YY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(
    (info) =>
      ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`,
  ),
)

export const winstonOptions: {
  [key in TransportKey]: LoggerOptions | ExtendedFileTransportOptions
} = {
  file: {},
  console: {
    level: config.winston.console.level,
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      alignColorsAndTime,
    ),
  },
  'file-rotate': {
    level: 'info',
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: config.winston.file.maxsize,
    maxFiles: config.winston.file.maxFiles,
    dirname: 'logs',
  },
}

addColors({
  info: 'bold blue', // fontStyle color
  warn: 'italic yellow',
  error: 'bold red',
  debug: 'green',
})

const logger = winston.createLogger({
  exitOnError: false, // do not exit on handled exceptions
  transports: [
    new winston.transports.Console(winstonOptions['console']),
    new winston.transports.DailyRotateFile(
      winstonOptions['file-rotate'] as any,
    ),
  ],
})

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  write: function (message: string) {
    // use the 'info' log level so the output will be picked up by both
    // transports (file and console)
    logger.info(message)
  },
}

export default logger
