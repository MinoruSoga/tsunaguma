import logger from '../../config/winston'

export default {
  info(message) {
    logger.info(message)
  },
  error(message) {
    logger.error(message)
  },
  warn(message) {
    logger.warn(message)
  },
}
