import HttpRequest from 'request-sdk'

export default (baseUrl: string) =>
  new HttpRequest(`${baseUrl}/tool/api`).request
