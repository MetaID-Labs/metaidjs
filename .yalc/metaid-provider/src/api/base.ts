import { Network } from '@/emums'
import { ApiBaseParams } from '@/types/common'
import { MetaSvBaseUrlMirror, ShowMoneyBaseUrlMirror } from '@/config'

export interface BaseApiConstructorParams {
  base?: {
    network?: Network
    showMoneyBaseUrl?: string
    metaSvBaseUrl?: string
  }
}

export default class BaseApi {
  showMoneyBaseUrl: string = ''
  metaSvBaseUrl: string = ''
  network = Network.Mainnet

  constructor(params?: BaseApiConstructorParams) {
    if (params?.base?.network) this.network = params.base.network
    if (params?.base?.showMoneyBaseUrl)
      this.showMoneyBaseUrl = params?.base?.showMoneyBaseUrl
    if (params?.base?.metaSvBaseUrl)
      this.metaSvBaseUrl = params.base.metaSvBaseUrl
  }

  getMetaSvBaseUrl(params?: ApiBaseParams) {
    return params?.metaSvBaseUrl
      ? params.metaSvBaseUrl
      : params?.network
      ? MetaSvBaseUrlMirror[params.network]
      : this.metaSvBaseUrl
      ? this.metaSvBaseUrl
      : MetaSvBaseUrlMirror[this.network]
  }

  getShowMoneyBaseUrl(params?: ApiBaseParams) {
    return params?.showMoneyBaseUrl
      ? params.showMoneyBaseUrl
      : params?.network
      ? ShowMoneyBaseUrlMirror[params.network]
      : this.showMoneyBaseUrl
      ? this.showMoneyBaseUrl
      : ShowMoneyBaseUrlMirror[this.network]
  }
}
