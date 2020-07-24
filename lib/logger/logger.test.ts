import { DocumentNode } from 'graphql'

import { logResolverLifecycle, logger } from './logger'

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

describe('lifeCycleLogger()', () => {
  beforeEach(() => {
    Object.defineProperties(logger, {
      info: { value: jest.fn() },
      error: { value: jest.fn() },
    })
  })

  it('should log the lifecycle events in a resolver', async () => {
    const wrappedResolver = logResolverLifecycle('make breakfast', resolver)
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
      lifeCycle: 'Start',
    })
    expect(logger.info).toHaveBeenCalledWith('Sending Result', {
      action: 'make breakfast',
      lifeCycle: 'End',
    })
    expect(logger.info).toHaveBeenCalledTimes(2)
  })

  it('should log a custom error message', async () => {
    const wrappedResolver = logResolverLifecycle(
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
        lifeCycle: 'Start',
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
    const wrappedResolver = logResolverLifecycle(
      'make breakfast',
      errorResolver
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
        lifeCycle: 'Start',
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
