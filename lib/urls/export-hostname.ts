/**
 * Parses the hostname from a url
 *
 * @param url - The URL to be parsed; can include the protocol or not
 *
 * @return The hostname from the url
 */
export function exportHostname(url: string): string {
  const hasProtocol = url.indexOf('//') > -1
  const hostname = hasProtocol ? url.split('/')[2] : url.split('/')[0]

  // find & remove port number and query params
  return hostname.split(':')[0].split('?')[0]
}
