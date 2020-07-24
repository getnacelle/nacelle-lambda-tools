import { DocumentNode } from 'graphql'
import { v4 } from 'uuid'
import { LambdaLog } from 'lambda-log'

const logger = new LambdaLog({
  dev: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
  debug: true,
})

export enum RequestLifeCycle {
  Start = 'Start',
  Processing = 'Processing',
  End = 'End',
}

export function logResolverLifecycle<T, U, V>(
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
        lifeCycle: RequestLifeCycle.Start,
      })

      const result = await resolver(parent, args, context)
      logger.info('Sending Result', { action, lifeCycle: RequestLifeCycle.End })

      return result
    } catch (err) {
      const errorId = v4()
      const message = customErrorMessage
        ? `Error: Failed to ${action}. ${customErrorMessage}. Error Id: ${errorId}. ${err.message}`
        : `Error: Failed to ${action}. Error Id: ${errorId}. ${err.message}`

      logger.error(message, { parent, args, context, action, error: err.stack })

      throw new Error(message)
    }
  }
}

export { logger }
