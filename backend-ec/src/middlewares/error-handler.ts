import { Logger } from '@medusajs/medusa/dist/types/global'
import { formatException } from '@medusajs/medusa/dist/utils'
import { NextFunction, Request, Response } from 'express'
import { MedusaError } from 'medusa-core-utils'

const QUERY_RUNNER_RELEASED = 'QueryRunnerAlreadyReleasedError'
const TRANSACTION_STARTED = 'TransactionAlreadyStartedError'
const TRANSACTION_NOT_STARTED = 'TransactionNotStartedError'

const API_ERROR = 'api_error'
const INVALID_REQUEST_ERROR = 'invalid_request_error'
const INVALID_STATE_ERROR = 'invalid_state_error'

type ExtendedError =
  | string
  | (MedusaError & {
      msg?: string
      stack?: any
    })

export default () => {
  return (
    err: ExtendedError,
    req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const logger: Logger = req.scope.resolve('logger')

    err = formatException(err)

    logger.error(err)

    const errorType = err.type || err.name

    const errObj = {
      code: err.code,
      type: err.type,
      message: typeof err === 'string' ? err : err.message || err.msg,
      stack: err.stack,
    }

    let statusCode = 500
    switch (errorType) {
      case QUERY_RUNNER_RELEASED:
      case TRANSACTION_STARTED:
      case TRANSACTION_NOT_STARTED:
      case MedusaError.Types.CONFLICT:
        statusCode = 409
        errObj.code = INVALID_STATE_ERROR
        errObj.message =
          'The request conflicted with another request. You may retry the request with the provided Idempotency-Key.'
        break
      case MedusaError.Types.DUPLICATE_ERROR:
        statusCode = 422
        errObj.code = INVALID_REQUEST_ERROR
        break
      case MedusaError.Types.NOT_ALLOWED:
      case MedusaError.Types.INVALID_DATA:
        statusCode = 400
        break
      case MedusaError.Types.NOT_FOUND:
        statusCode = 404
        break
      case MedusaError.Types.DB_ERROR:
        statusCode = 500
        errObj.code = API_ERROR
        break
      case MedusaError.Types.UNEXPECTED_STATE:
      case MedusaError.Types.INVALID_ARGUMENT:
        break
      default:
        errObj.code = 'server_error'
        if (!errObj.message) {
          errObj.message = 'An unknown error occurred.'
        }
        errObj.type = 'server_error'
        break
    }

    res.status(statusCode).json(errObj)
  }
}

/**
 * @schema error
 * title: "Response Error"
 * x-resourceId: error
 * properties:
 *  code:
 *    type: string
 *    description: A slug code to indicate the type of the error.
 *  message:
 *    type: string
 *    description: Description of the error that occurred.
 *  type:
 *    type: string
 *    description: A slug indicating the type of the error.
 */
