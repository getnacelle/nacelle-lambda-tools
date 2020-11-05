import { DocumentNode } from 'graphql'
import { v4 } from 'uuid'
import { LambdaLog } from 'lambda-log'
import { APIGatewayEvent } from 'aws-lambda'

export const logger: LambdaLog = new LambdaLog({
  dev: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
  debug: true,
})

export function logResolver<T, U, V>(
  action = 'Perform Operation',
  resolver: (parent: DocumentNode, args: T, context: U) => Promise<V>,
  customErrorMessage?: string
): (parent: DocumentNode, args: T, context: U) => Promise<V> {
  return async function logWrappedFunction(
    parent: DocumentNode,
    args: T,
    context: U
  ): Promise<V> {
    try {
      logger.info('Request Received', {
        parent,
        args,
        context,
        action,
      })

      const response = await resolver(parent, args, context)
      logger.info('Sending Response', { action })

      return response
    } catch (error) {
      const message = logError(
        error,
        action,
        { parent, args, context },
        customErrorMessage
      )

      throw new Error(message)
    }
  }
}

export const logHttpEvent = <T>(
  action = 'Perform Operation',
  handler: (event: APIGatewayEvent) => Promise<T>,
  customErrorMessage?: string
) => async (event: APIGatewayEvent): Promise<T> => {
  try {
    logger.info(`Request Received`, { event, action })
    const response = await handler(event)
    logger.info(`Sending Response`, { action })
    return response
  } catch (error) {
    throw new Error(logError(error, action, { event }, customErrorMessage))
  }
}

export const logError = (
  error: Error,
  action: string,
  meta?: Record<string, unknown> | undefined,
  customErrorMessage?: string
): string => {
  const errorId = v4()
  const customErrorSentence = customErrorMessage
    ? ` ${customErrorMessage}.`
    : ''
  const message = `Error: Failed to ${action}.${customErrorSentence} Error Id: ${errorId}. ${error.message}`
  logger.error(message, { action, ...meta, error: error.stack })
  return message
}
