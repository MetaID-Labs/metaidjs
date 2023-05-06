import HttpRequest from 'request-sdk'

export default (baseUrl: string) =>
  new HttpRequest(`${baseUrl}/aggregation`).request
