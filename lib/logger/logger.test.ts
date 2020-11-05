import { APIGatewayEvent } from 'aws-lambda'
import { DocumentNode } from 'graphql'

import { logResolver, logHttpEvent, logger } from './logger'

interface ResolverArgs {
  chicken: string
}

interface ResolverContext {
  userEmail: string
}

const resolver = (
  _parent: DocumentNode,
  args: ResolverArgs,
  context: ResolverContext
) => {
  return Promise.resolve(`bacon & ${args.chicken} for ${context.userEmail}`)
}

const errorResolver = () => {
  throw new Error('I dropped the eggs!')
}

const handler = (event: APIGatewayEvent) => {
  return Promise.resolve(`bacon & ${event.body}`)
}

const errorHandler = () => {
  throw new Error('I dropped the eggs!')
}

describe('logResolver()', () => {
  beforeEach(() => {
    Object.defineProperties(logger, {
      info: { value: jest.fn() },
      error: { value: jest.fn() },
    })
  })

  it('should log the lifecycle events in a resolver', async () => {
    const wrappedResolver = logResolver('make breakfast', resolver)
    const result = await wrappedResolver(
      undefined,
      { chicken: 'eggs' },
      { userEmail: 'yummy@me.com' }
    )

    expect(result).toEqual(`bacon & eggs for yummy@me.com`)
    expect(logger.info).toHaveBeenCalledWith('Request Received', {
      parent: undefined,
      args: { chicken: 'eggs' },
      context: { userEmail: 'yummy@me.com' },
      action: 'make breakfast',
    })
    expect(logger.info).toHaveBeenCalledWith('Sending Response', {
      action: 'make breakfast',
    })
    expect(logger.info).toHaveBeenCalledTimes(2)
  })

  it('should log a custom error message', async () => {
    const wrappedResolver = logResolver(
      'make breakfast',
      errorResolver,
      'You did a bad'
    )

    try {
      const result = await wrappedResolver(
        undefined,
        { chicken: 'eggs' },
        { userEmail: 'yummy@me.com' }
      )
      expect(result).toBeUndefined()
    } catch (err) {
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith('Request Received', {
        parent: undefined,
        args: { chicken: 'eggs' },
        context: { userEmail: 'yummy@me.com' },
        action: 'make breakfast',
      })
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(String), {
        parent: undefined,
        args: { chicken: 'eggs' },
        context: { userEmail: 'yummy@me.com' },
        action: 'make breakfast',
        error: expect.anything(),
      })
      expect(err.message).toContain(
        'Error: Failed to make breakfast. You did a bad. Error Id: '
      )
      expect(err.message).toContain('I dropped the eggs!')
    }
  })

  it('should catch and log generic errors', async () => {
    const wrappedResolver = logResolver('make breakfast', errorResolver)

    try {
      const result = await wrappedResolver(
        undefined,
        { chicken: 'eggs' },
        { userEmail: 'yummy@me.com' }
      )
      expect(result).toBeUndefined()
    } catch (err) {
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith('Request Received', {
        parent: undefined,
        args: { chicken: 'eggs' },
        context: { userEmail: 'yummy@me.com' },
        action: 'make breakfast',
      })
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(String), {
        parent: undefined,
        args: { chicken: 'eggs' },
        context: { userEmail: 'yummy@me.com' },
        action: 'make breakfast',
        error: expect.anything(),
      })
      expect(err.message).toContain('Failed to make breakfast')
      expect(err.message).toContain('Error Id:')
      expect(err.message).toContain('I dropped the eggs!')
    }
  })
})

describe('logHttpEvent()', () => {
  beforeEach(() => {
    Object.defineProperties(logger, {
      info: { value: jest.fn() },
      error: { value: jest.fn() },
    })
  })

  it('should log the lifecycle events in a resolver', async () => {
    const wrappedHttpEvent = logHttpEvent('make breakfast', handler)
    const result = await wrappedHttpEvent({ body: 'eggs' } as APIGatewayEvent)

    expect(result).toEqual(`bacon & eggs`)
    expect(logger.info).toHaveBeenCalledWith('Request Received', {
      event: { body: 'eggs' },
      action: 'make breakfast',
    })
    expect(logger.info).toHaveBeenCalledWith('Sending Response', {
      action: 'make breakfast',
    })
    expect(logger.info).toHaveBeenCalledTimes(2)
  })

  it('should log a custom error message', async () => {
    const wrappedHttpEvent = logHttpEvent(
      'make breakfast',
      errorHandler,
      'You did a bad'
    )

    try {
      const result = await wrappedHttpEvent({ body: 'eggs' } as APIGatewayEvent)
      expect(result).toBeUndefined()
    } catch (err) {
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith('Request Received', {
        event: { body: 'eggs' },
        action: 'make breakfast',
      })
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(String), {
        event: { body: 'eggs' },
        action: 'make breakfast',
        error: expect.anything(),
      })
      expect(err.message).toContain(
        'Error: Failed to make breakfast. You did a bad. Error Id: '
      )
      expect(err.message).toContain('I dropped the eggs!')
    }
  })

  it('should catch and log generic errors', async () => {
    const wrappedHttpEvent = logHttpEvent('make breakfast', errorHandler)

    try {
      const result = await wrappedHttpEvent({ body: 'eggs' } as APIGatewayEvent)
      expect(result).toBeUndefined()
    } catch (err) {
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith('Request Received', {
        event: { body: 'eggs' },
        action: 'make breakfast',
      })
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(expect.any(String), {
        event: { body: 'eggs' },
        action: 'make breakfast',
        error: expect.anything(),
      })
      expect(err.message).toContain('Failed to make breakfast')
      expect(err.message).toContain('Error Id:')
      expect(err.message).toContain('I dropped the eggs!')
    }
  })
})
