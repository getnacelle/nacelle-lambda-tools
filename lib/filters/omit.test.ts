import { omit } from './omit'

describe('omit()', () => {
  it('should omit any keys provided', () => {
    const breakfast = {
      bacon: 'yes',
      eggs: true,
      toast: false,
    }

    const result = omit(breakfast, ['toast'])
    expect(result).toEqual({ bacon: 'yes', eggs: true })
  })

  it('should return the original value if it is not an object', () => {
    const result = omit('batman', ['toast'])
    expect(result).toEqual('batman')
  })
})
