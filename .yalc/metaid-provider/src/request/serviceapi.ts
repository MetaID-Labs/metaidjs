import HttpRequest from 'request-sdk'
import { Network } from '../emums'

export default (baseUrl: string) =>
  new HttpRequest(`${baseUrl}/serviceapi`).request
