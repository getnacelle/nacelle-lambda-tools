import { exportHostname } from './export-hostname'

describe('exportHostname()', () => {
  it('should return the host name from a url that includes the protocol', () => {
    const result = exportHostname(
      'https://www.example.com/my/path/to/greatness.json'
    )
    expect(result).toEqual('www.example.com')
  })

  it('should return the host name from a url that does not include the protocol', () => {
    const result = exportHostname('www.example.com/my/path/to/greatness.json')
    expect(result).toEqual('www.example.com')
  })
})
