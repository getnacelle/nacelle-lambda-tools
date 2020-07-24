import { filterFromList } from './filter-from-list'

describe('filterFromList()', () => {
  it('should filter out values from a list', () => {
    const values = ['bacon', 'eggs', 'toast']

    const excludeEggs = filterFromList(['eggs'])
    const result = values.filter(excludeEggs)
    expect(result).toEqual(['bacon', 'toast'])
  })

  it('should exclude values in a 2 dimensional array', () => {
    const values = { bacon: true, eggs: true, toast: false }

    const excludeEggs = filterFromList(['eggs'])
    const result = Object.entries(values).filter(excludeEggs)
    expect(result).toEqual([
      ['bacon', true],
      ['toast', false],
    ])
  })
})
