import { removeEmptyKeys } from './remove-empty-keys'

describe('removeEmptyKeys()', () => {
  it('should recursively remove empty keys from an object', () => {
    const breakfast = {
      bacon: true,
      toast: {
        buttered: true,
        thick: null,
      },
      eggs: '',
    }

    const result = removeEmptyKeys(breakfast)
    expect(result).toEqual({
      bacon: true,
      toast: {
        buttered: true,
      },
    })
  })
})
