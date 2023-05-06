import { UtxoConstructorParams, UtxoItem } from '@/types/utxo'
import BaseApi from './base'
import tool from '@/request/tool'
import { ApiBaseParams } from '@/types/common'

export default class Tool extends BaseApi {
  constructor(params: UtxoConstructorParams) {
    super(params)
  }

  // 后台准备使用的utxos
  getUtxos(params: { page: number; pageSize: number }, option?: ApiBaseParams) {
    return <Promise<[UtxoItem[], number]>>(
      tool(this.getShowMoneyBaseUrl(option)).get('/utxos', { params })
    )
  }
}
