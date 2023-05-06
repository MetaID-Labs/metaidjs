import { MetaSvBaseUrlMirror, ShowMoneyBaseUrlMirror } from './config'
import { Network } from './emums'
import { ApiBaseParams } from './types/common'

export interface GetBaseUrlParams extends ApiBaseParams {
  classParams: {
    metaSvBaseUrl?: string
    showMoneyBaseUrl?: string
    network?: Network
  }
}

export function getMetaSvBaseUrl(params: GetBaseUrlParams) {
  params.classParams = {
    network: Network.Mainnet,
    ...params?.classParams
  }
  return params?.metaSvBaseUrl
    ? params.metaSvBaseUrl
    : params?.network
    ? MetaSvBaseUrlMirror[params.network]
    : params.classParams?.metaSvBaseUrl
    ? params.classParams.metaSvBaseUrl
    : MetaSvBaseUrlMirror[params.classParams?.network!]
}

export function getShowMoneyBaseUrl(params: GetBaseUrlParams) {
  params.classParams = {
    network: Network.Mainnet,
    ...params.classParams
  }
  return params?.showMoneyBaseUrl
    ? params.showMoneyBaseUrl
    : params?.network
    ? ShowMoneyBaseUrlMirror[params.network]
    : params.classParams.showMoneyBaseUrl
    ? params.classParams.showMoneyBaseUrl
    : ShowMoneyBaseUrlMirror[params.classParams.network!]
}
